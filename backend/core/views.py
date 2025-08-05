# backend/core/views.py

from datetime import date
from calendar import monthrange
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count, F, Exists, OuterRef, ProtectedError

from users.models import User
from finance.models import Transaction
from .filters import StudentFilter, GroupFilter
from .models import (
    Branch,
    Group,
    Student,
    Attendance,
    StudentGroup,
    Room,
    Holiday,
    GroupScheduleOverride,
)
from users.permissions import IsAuthenticatedOrAdminForUnsafe, IsAdminUser
from .serializers import (
    DashboardStatsSerializer,
    BranchSerializer,
    RoomSerializer,
    StudentSerializer,
    StudentCreateSerializer,
    StudentUpdateSerializer,
    GroupSerializer,
    StudentGroupEnrollSerializer,
    StudentEnrollmentSerializer,
    HolidaySerializer,
    GroupScheduleOverrideSerializer,
    GroupDetailSerializer,
    StudentGroupListSerializer,
    AttendanceSerializer,
)


class BranchViewSet(viewsets.ModelViewSet):
    """
    Branch View Set
    """

    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticatedOrAdminForUnsafe]

    def get_queryset(self):
        queryset = Branch.objects.all()
        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return queryset.filter(is_archived=is_archived).order_by("created_at")


class RoomViewSet(viewsets.ModelViewSet):
    """
    Room View Set
    """

    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticatedOrAdminForUnsafe]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["name", "extra_info"]
    search_param = "search"
    filterset_fields = ["branch"]

    def get_queryset(self):
        today = timezone.now().date()

        queryset = Room.objects.select_related("branch").annotate(
            active_groups_count=Count(
                "group", filter=Q(group__is_archived=False, group__end_date__gte=today)
            )
        )

        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return queryset.filter(is_archived=is_archived).order_by("name")

    def _check_for_active_groups(self, room):
        """Helper method to check for active groups in a room."""
        today = timezone.now().date()
        active_groups = room.group_set.filter(is_archived=False, end_date__gte=today)
        if active_groups.exists():
            raise ValidationError(
                "Bu xonani o'chirib/arxivlab bo'lmaydi, chunki unda faol guruhlar mavjud."
            )

    def perform_destroy(self, instance):
        # Run our safety check before allowing deletion
        self._check_for_active_groups(instance)
        super().perform_destroy(instance)

    def get_object(self):
        queryset = Room.objects.all()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        room = self.get_object()
        # Run our safety check before allowing archiving
        self._check_for_active_groups(room)

        room.is_archived = True
        room.archived_at = timezone.now()
        room.save()
        return Response({"status": "Room archived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        room = self.get_object()
        room.is_archived = False
        room.archived_at = None
        room.save()
        return Response({"status": "Room restored"}, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """
    Provides aggregated statistics for the main dashboard.
    """

    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        today = timezone.now().date()

        students_with_balance = Student.objects.filter(is_archived=False).annotate(
            balance=Sum(
                "group_memberships__transactions__amount",
                filter=Q(group_memberships__transactions__transaction_type="CREDIT"),
                default=0.0,
            )
            - Sum(
                "group_memberships__transactions__amount",
                filter=Q(group_memberships__transactions__transaction_type="DEBIT"),
                default=0.0,
            )
        )

        due_date_start = today - timedelta(days=30)
        due_date_end = today - timedelta(days=23)
        due_soon_subquery = StudentGroup.objects.filter(
            student=OuterRef("pk"),
            is_archived=False,
            group__is_archived=False,
            group__end_date__gte=today,
            transactions__category="MONTHLY_FEE",
            transactions__created_at__date__range=(due_date_start, due_date_end),
        )
        payment_due_soon_count = (
            Student.objects.filter(is_archived=False)
            .annotate(is_due_soon=Exists(due_soon_subquery))
            .filter(is_due_soon=True)
            .count()
        )

        # --- 3. Aggregate All Statistics ---
        total_debt_amount = (
            students_with_balance.filter(balance__lt=0).aggregate(total=Sum("balance"))[
                "total"
            ]
            or 0
        )

        # NOTE: Replace these with your actual business logic and models
        # This is example logic.
        stats_data = {
            "active_leads": 0,  # Lead.objects.filter(status='active').count()
            "groups": Group.objects.filter(is_archived=False).count(),
            "remaining_debts": abs(total_debt_amount),
            "debtors": students_with_balance.filter(balance__lt=0).count(),
            "payment_due_soon": payment_due_soon_count,
            "active_students": Student.objects.filter(is_archived=False).count(),
            "attrition_students": Student.objects.filter(is_archived=True).count(),
            "teachers": User.objects.filter(is_teacher=True, is_active=True).count(),
            "admins": User.objects.filter(is_admin=True, is_active=True).count(),
        }

        serializer = DashboardStatsSerializer(instance=stats_data)
        return Response(serializer.data)


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "")
        if not query or len(query) < 2:
            return Response([])

        # Search for teachers/staff in the User model
        teachers = User.objects.filter(
            Q(is_teacher=True)
            & (Q(full_name__icontains=query) | Q(phone_number__icontains=query)),
        ).values("id", "full_name", "phone_number")[
            :10
        ]  # Limit results

        # Search for students in the Student model
        students = Student.objects.filter(
            Q(full_name__icontains=query) | Q(phone_number__icontains=query)
        ).values("id", "full_name", "phone_number")[
            :10
        ]  # Limit results

        # Format results with a type identifier for the frontend
        results = []
        for teacher in teachers:
            results.append(
                {
                    "id": teacher["id"],
                    "type": "teacher",
                    "name": teacher["full_name"],
                    "phone": f"+{teacher['phone_number']}",
                }
            )

        for student in students:
            results.append(
                {
                    "id": student["id"],
                    "type": "student",
                    "name": student["full_name"],
                    "phone": f"+{student['phone_number']}",
                }
            )

        return Response(results)


class DailyAiStatsView(APIView):
    """
    Provides detailed daily statistics for the AI Assistant modal.
    Accepts a query parameter 'day' which can be 'today' or 'yesterday'.
    """

    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        day_param = request.query_params.get("day", "yesterday")

        if day_param == "today":
            target_date = timezone.now().date()
        else:
            target_date = timezone.now().date() - timedelta(days=1)

        # --- FINANCE FIX: Calculate income from the Transaction model ---
        total_income = (
            Transaction.objects.filter(
                created_at__date=target_date,
                category=Transaction.TransactionCategory.PAYMENT,
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        # You would calculate expenses similarly if you had an expense model/category
        total_expenses = 0

        absent_count = Attendance.objects.filter(
            date=target_date, is_present=False
        ).count()

        absent_by_group = []
        absent_groups = (
            Attendance.objects.filter(date=target_date, is_present=False)
            .values("student_group__group__name")
            .annotate(count=Count("id"))
        )
        for item in absent_groups:
            absent_by_group.append(
                {
                    "group_name": item["student_group__group__name"],
                    "count": item["count"],
                }
            )

        data = {
            "greeting_name": request.user.full_name,
            "income": f"{int(total_income)} so'm",
            "expenses": f"{int(total_expenses)} so'm",
            "absent_students_total": absent_count,
            "absent_by_group": absent_by_group,
            "new_leads": 0,
            "uncontacted_leads": 0,
            "newly_joined_students": 0,
            "students_left": 0,
            "summary": {
                "income_summary": (
                    f"✅ Moliya bo'yicha rejalar to'liq bajarildi! 😃 Ajoyib ish!"
                    if total_income > 0
                    else "❌ hech qanday kirimlar yo'q 😏"
                ),
                "lead_summary": "😎 Lidlar: Kecha lidlar guruhga qo'shilmadi",
                "admin_summary": "👍 Administratsiya bo'limi yaxshi ishlamayapti.",
            },
        }
        return Response(data)


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, and managing Students with advanced filtering.
    """

    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticatedOrAdminForUnsafe]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = StudentFilter
    search_fields = ["full_name", "phone_number"]

    def get_serializer_class(self):
        # Use the new serializer only for the 'create' action
        if self.action == "create":
            return StudentCreateSerializer
        if self.action in ["update", "partial_update"]:
            return StudentUpdateSerializer
        return StudentSerializer

    def get_serializer_context(self):
        # Pass the selected branch ID from the request into the serializer
        context = super().get_serializer_context()
        try:
            # Assume the frontend will send the branch ID in the request data
            branch_id = self.request.data.get("branch")
            context["branch"] = Branch.objects.get(pk=branch_id)
        except (Branch.DoesNotExist, ValueError, TypeError):
            # If no branch is provided or it's invalid, this will be handled by the serializer/view logic
            context["branch"] = None
        return context

    def create(self, request, *args, **kwargs):
        # We need to ensure the branch context is set before validation
        context = self.get_serializer_context()
        if not context.get("branch"):
            return Response(
                {"branch": ["Bu filial mavjud emas yoki tanlanmagan."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def get_queryset(self):
        queryset = (
            Student.objects.select_related("branch")
            .prefetch_related("group_memberships__group__teacher")
            .annotate(
                total_credits=Sum(
                    "group_memberships__transactions__amount",
                    filter=Q(
                        group_memberships__transactions__transaction_type="CREDIT"
                    ),
                    default=0.0,
                ),
                total_debits=Sum(
                    "group_memberships__transactions__amount",
                    filter=Q(group_memberships__transactions__transaction_type="DEBIT"),
                    default=0.0,
                ),
                balance=F("total_credits") - F("total_debits"),
            )
        )

        user: User = self.request.user
        if not (user.is_ceo or user.is_admin or user.is_superuser):
            queryset = queryset.filter(group_memberships__group__teacher__id=user.pk)

        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return queryset.filter(is_archived=is_archived).order_by("full_name")

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()

        # 1. Check for related objects
        has_groups = student.group_memberships.exists()
        has_payments = student.payments.exists()

        # 2. If the student has related data
        if has_groups or has_payments:
            # 3. Only allow deletion if the user is a superuser
            if not request.user.is_superuser:
                return Response(
                    {
                        "detail": "Bu o'quvchini o'chirib bo'lmaydi, chunki u guruhlarga yoki to'lovlarga bog'langan. Faqat Superuser o'chira oladi."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # 4. If checks pass, proceed with the default deletion
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "detail": "Bu o'quvchini o'chirib bo'lmaydi, chunki unga bog'langan boshqa ma'lumotlar mavjud."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get_object(self):
        queryset = Student.objects.all()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Custom action to archive (soft delete) a student."""
        student = self.get_object()
        active_enrollments = StudentGroup.objects.filter(
            student=student, is_archived=False
        )
        if active_enrollments.exists():
            return Response(
                {
                    "detail": "Bu o'quvchini arxivlab bo'lmaydi, chunki uning aktiv guruhlari mavjud."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        student.is_archived = True
        student.archived_at = timezone.now()
        student.save()
        return Response({"status": "Student archived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Custom action to restore an archived student."""
        student = self.get_object()
        student.is_archived = False
        student.archived_at = None
        student.save()
        return Response({"status": "Student restored"}, status=status.HTTP_200_OK)


class GroupViewSet(viewsets.ModelViewSet):
    """
    A full-featured ViewSet for managing Groups that includes
    advanced validation for scheduling conflicts.
    """

    permission_classes = [IsAuthenticatedOrAdminForUnsafe]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = GroupFilter
    search_fields = ["name", "teacher__full_name"]

    def get_serializer_class(self):
        # Use the new detailed serializer for the 'retrieve' (detail) action
        if self.action == "retrieve":
            return GroupDetailSerializer
        return GroupSerializer

    def get_queryset(self):
        # The existing queryset logic is fine
        queryset = Group.objects.select_related(
            "teacher", "branch", "room"
        ).prefetch_related("students")
        queryset = queryset.annotate(students_count=Count("students", distinct=True))
        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return (
            queryset.filter(is_archived=is_archived)
            .order_by("start_date")
            .order_by("created_at")
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Overrides the default retrieve to use optimized queries for the detail page.
        """
        instance: Group = self.get_object()

        instance = Group.objects.prefetch_related(
            "students__student",  # Prefetch StudentGroup, then the related Student
            "price_history",
        ).get(pk=instance.pk)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def _check_for_conflicts(self, validated_data, instance=None):
        """
        A helper method containing the core conflict detection logic.
        Can be used for both creating and updating groups.
        - `validated_data`: The incoming data from the serializer.
        - `instance`: The existing group object if we are updating, otherwise None.
        """
        if "room" not in validated_data or not validated_data["room"]:
            return  # No room assigned, so no conflict is possible

        room = validated_data["room"]
        start_time = validated_data["course_start_time"]
        end_time = validated_data["course_end_time"]
        weekdays = set(validated_data["weekdays"])  # e.g., {'1', '3', '5'}
        start_date = validated_data["start_date"]
        end_date = validated_data["end_date"]

        # --- CONFLICT CHECKING QUERY ---
        # Find other groups that could potentially conflict.
        conflicting_groups = Group.objects.filter(
            # 1. Must be in the same room.
            room=room,
            # 2. Must be an active group.
            is_archived=False,
            # 3. Their date range must overlap with the new group's date range.
            start_date__lte=end_date,
            end_date__gte=start_date,
            # 4. Their time slot must overlap.
            # (StartTimeA < EndTimeB) and (EndTimeA > StartTimeB)
            course_start_time__lt=end_time,
            course_end_time__gt=start_time,
        )

        # If we are updating a group, we must exclude it from the conflict check.
        if instance:
            conflicting_groups = conflicting_groups.exclude(pk=instance.pk)

        # Now, we check in Python if the weekdays overlap.
        for existing_group in conflicting_groups:
            existing_weekdays = set(existing_group.weekdays)
            # The '&' operator finds the intersection of two sets.
            # If the intersection is not empty, it means they share at least one day.
            if weekdays & existing_weekdays:
                # CONFLICT FOUND!
                raise ValidationError(
                    f"Xona band! Bu vaqtda '{existing_group.name}' guruhi mavjud."
                )

    def perform_create(self, serializer):
        """
        Called when creating a new group (POST request).
        """
        # First, run our custom conflict check on the validated data.
        self._check_for_conflicts(serializer.validated_data)

        # If no error was raised, proceed with saving the new group.
        serializer.save()

    def perform_update(self, serializer):
        """
        Called when updating an existing group (PATCH/PUT request).
        """
        # We need to build a complete picture of the group's state after the update.
        # Start with the existing instance data.
        instance_data = self.get_object().__dict__
        # Override it with any new data from the request.
        updated_data = {**instance_data, **serializer.validated_data}

        # Now run the conflict check on the final, merged data.
        self._check_for_conflicts(updated_data, instance=serializer.instance)

        # If no error was raised, proceed with saving the changes.
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()

        # 1. Check for related objects
        active_enrollments = StudentGroup.objects.filter(group=group, is_archived=False)

        # 2. If the group has related data
        if active_enrollments.exists():
            # 3. Only allow deletion if the user is a superuser
            # if not request.user.is_superuser:
            return Response(
                {
                    "detail": "Bu guruhni o'chirib bo'lmaydi, chunki unda aktiv o'quvchilar mavjud"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. If checks pass, proceed with the default deletion
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "detail": "Bu o'quvchini o'chirib bo'lmaydi, chunki unga bog'langan boshqa ma'lumotlar mavjud."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get_object(self):
        queryset = Group.objects.all()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Custom action to archive (soft delete) a group."""
        group: Group = self.get_object()
        # active_enrollments = StudentGroup.objects.filter(group=group, is_archived=False)
        # if active_enrollments.exists():  # check this group has active students
        #     return Response(
        #         {
        #             "detail": f"Ushbu guruh aktiv va unda o'quvchilar mavjud. Arxivlashdan oldin o'quvchilarni guruhdan chiqaring yoki arxivlang."
        #         },
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )
        group.is_archived = True
        group.archived_at = timezone.now()
        group.save()
        return Response({"status": "Group archived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Custom action to restore an archived group."""
        group = self.get_object()
        group.is_archived = False
        group.archived_at = None
        group.save()
        return Response({"status": "Group restored"}, status=status.HTTP_200_OK)

    def _get_date_range_from_params(self, request):
        """Helper method to parse date range from request query parameters."""
        year = request.query_params.get("year")
        month = request.query_params.get("month")
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")
        if year and month:
            try:
                year, month = int(year), int(month)
                # Get the first and last day of the given month and year
                first_day = date(year, month, 1)
                last_day_of_month = monthrange(year, month)[1]
                last_day = date(year, month, last_day_of_month)
                return first_day, last_day
            except (ValueError, TypeError):
                raise ValidationError("Yil va oy noto'g'ri formatda.")
        elif start_date_str and end_date_str:
            try:
                start_date = date.fromisoformat(start_date_str)
                end_date = date.fromisoformat(end_date_str)
                return start_date, end_date
            except ValueError:
                raise ValidationError("Sana noto'g'ri formatda (YYYY-MM-DD).")
        else:
            raise ValidationError(
                "Iltimos, 'year' va 'month' yoki 'start_date' va 'end_date' parametrlarini kiriting."
            )

    @action(detail=True, methods=["get"])
    def lesson_schedule(self, request, pk=None):
        """
        Returns the regular and actual lesson days for the group within a given range.
        Accepts params: ?year=2025&month=8 OR ?start_date=2025-08-01&end_date=2025-08-31
        """
        group = self.get_object()
        start_range, end_range = self._get_date_range_from_params(request)

        regular_days = group.regular_lesson_days(start_range, end_range)
        actual_days = group.actual_lesson_days(start_range, end_range)

        data = {
            "group_id": group.id,
            "group_name": group.name,
            "checked_range": {"start": start_range, "end": end_range},
            "regular_lesson_dates": sorted(list(regular_days)),
            "actual_lesson_dates": actual_days,
        }
        return Response(data)

    # --- THIS IS THE SECOND NEW ACTION ---
    @action(detail=True, methods=["get"])
    def schedule_details(self, request, pk=None):
        """
        Returns the holidays and schedule overrides that fall within a given range
        for this specific group.
        """
        group: Group = self.get_object()
        start_range, end_range = self._get_date_range_from_params(request)

        # Find holidays that fall on this group's regular schedule
        regular_days_in_range = group.regular_lesson_days(start_range, end_range)
        holidays = Holiday.objects.filter(date__in=regular_days_in_range)

        # Find overrides that affect this group in the given range
        overrides = group.schedule_overrides.filter(
            Q(original_date__range=(start_range, end_range))
            | Q(new_date__range=(start_range, end_range))
        )

        data = {
            "group_id": group.id,
            "checked_range": {"start": start_range, "end": end_range},
            "holidays": HolidaySerializer(holidays, many=True).data,
            "overrides": GroupScheduleOverrideSerializer(overrides, many=True).data,
        }
        return Response(data)


class StudentGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing StudentGroup enrollments.
    For now, we only need the 'create' action.
    """

    serializer_class = StudentGroupEnrollSerializer
    permission_classes = [IsAuthenticatedOrAdminForUnsafe]
    queryset = StudentGroup.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["student", "group"]
    ordering_fields = ["student__full_name", "joined_at", "balance"]

    def get_serializer_class(self):
        if self.action == "list":
            return StudentGroupListSerializer
        # The enroll serializer is used for creating
        return StudentGroupEnrollSerializer

    def get_queryset(self):
        # Annotate every enrollment with its calculated balance
        queryset = StudentGroup.objects.select_related("student", "group").annotate(
            current_balance=Sum(
                "transactions__amount",
                filter=Q(transactions__transaction_type="CREDIT"),
                default=0.0,
            )
            - Sum(
                "transactions__amount",
                filter=Q(transactions__transaction_type="DEBIT"),
                default=0.0,
            )
        )
        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return (
            queryset.filter(is_archived=is_archived)
            .order_by("created_at")
            .order_by("joined_at")
        )
        return queryset

    def get_object(self):
        queryset = StudentGroup.objects.all()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["patch"])
    def archive(self, request, pk=None):
        """
        Soft-deletes (archives) a student's enrollment in a group.
        Expects a payload like: { "archived_at": "YYYY-MM-DD" }
        """
        enrollment: StudentGroup = self.get_object()
        archive_date = request.data.get("archived_at")

        # Basic validation
        if not archive_date:
            return Response(
                {"detail": "Chiqarish sanasi kiritilishi shart."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment.is_archived = True
        # The 'archived_at' field name in your BaseModel is 'archived_time', let's correct this.
        # If your model uses 'archived_at', change the name here.
        enrollment.archived_at = archive_date
        enrollment.save()

        return Response(
            {"status": f"{enrollment.student.full_name} guruhdan chiqarildi."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """
        Custom action to restore student group
        """
        enrollment: StudentGroup = self.get_object()
        enrollment.is_archived = False
        enrollment.archived_at = None
        enrollment.save()

        return Response(
            {"status": f"{enrollment.student.full_name} guruhga qayta qo'shildi."},
            status=status.HTTP_200_OK,
        )


class StudentEnrollmentListView(generics.ListAPIView):
    """
    Returns a list of active enrollments for a specific student.
    Accessed via /api/core/student-enrollments/?student_id=5
    """

    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        student_id = self.request.query_params.get("student_id")
        if not student_id:
            return StudentGroup.objects.none()

        today = timezone.now().date()

        # An enrollment is active if the StudentGroup is not archived,
        # the Group is not archived, and the course has not ended.
        return StudentGroup.objects.filter(
            student__id=student_id,
            is_archived=False,
            group__is_archived=False,
            group__end_date__gte=today,
        ).select_related("group__teacher")


class GroupAttendanceView(APIView):
    """
    A custom view to get and set attendance for a specific group for a given month.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, group_id, *args, **kwargs):
        """
        GET /api/core/groups/5/attendance/?year=2025&month=8
        Returns all lesson days and existing attendance records for a group in a given month.
        """
        try:
            group = Group.objects.get(pk=group_id)
            year = int(request.query_params.get("year"))
            month = int(request.query_params.get("month"))
        except (Group.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Get all actual lesson days for the month using our model method
        start_range = date(year, month, 1)
        end_range = date(year, month, monthrange(year, month)[1])
        lesson_days = group.actual_lesson_days(start_range, end_range)

        # 2. Get all active and archived student enrollments for this group
        enrollments = group.students.select_related("student").all()

        # 3. Get all existing attendance records for these days
        existing_attendance = Attendance.objects.filter(
            student_group__in=enrollments, date__in=lesson_days
        )

        # 4. Serialize the data into a structured format for the frontend
        serialized_attendance = {}
        for att in existing_attendance:
            key = f"{att.student_group.id}_{att.date.isoformat()}"
            serialized_attendance[key] = {
                "is_present": att.is_present,
                "comment": att.comment,
            }

        response_data = {
            "lesson_days": lesson_days,
            "enrollments": [
                {
                    "student_group_id": en.id,
                    "student_name": en.student.full_name,
                    "is_archived": en.is_archived,
                }
                for en in enrollments
            ],
            "attendance_data": serialized_attendance,
        }
        return Response(response_data)

    def post(self, request, group_id, *args, **kwargs):
        """
        POST /api/core/groups/5/attendance/
        Creates, updates, or deletes an attendance record.
        Payload: { student_group_id: 123, date: "YYYY-MM-DD", is_present: true/false/null, comment: "..." }
        """
        data = request.data
        student_group_id = data.get("student_group_id")
        attendance_date = data.get("date")
        is_present = data.get("is_present")
        comment = data.get("comment", "")

        # Find the existing record, or prepare to create a new one
        record, created = Attendance.objects.get_or_create(
            student_group_id=student_group_id, date=attendance_date
        )

        # If is_present is null, it means "delete" (uncheck the box)
        if is_present is None:
            if not created:  # Only delete if it actually existed
                record.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Otherwise, update the record
        record.is_present = is_present
        # A comment is required for an absence
        if is_present is False and not comment:
            return Response(
                {"comment": "Sababini kiritish majburiy."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        record.comment = comment
        record.save()

        return Response(AttendanceSerializer(record).data, status=status.HTTP_200_OK)
