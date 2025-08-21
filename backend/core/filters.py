import django_filters
from datetime import timedelta
from django.utils import timezone
from .models import Student, Group, StudentGroup, Room
from django.db.models import F, Sum, Max, Q, Exists, OuterRef


class StudentFilter(django_filters.FilterSet):
    # Filter by group status ('Faol' or 'Guruhsiz')
    branch = django_filters.NumberFilter(field_name="branch__id")

    exclude_groups = django_filters.CharFilter(method="filter_exclude_groups")
    group_id = django_filters.NumberFilter(field_name="group_memberships__group__id")

    # --- PAYMENT STATUS FILTER ---
    payment_status = django_filters.ChoiceFilter(
        choices=(
            ("debtor", "Debtor"),
            ("due_soon", "Due Soon"),
            ("overpaid", "Overpaid"),
        ),
        method="filter_by_payment_status",
        label="To'lov holati",
    )

    group_status = django_filters.ChoiceFilter(
        choices=(
            ("active", "Active"),  # Student is currently in at least one active group
            ("inactive", "Inactive"),  # Student is only in past/archived groups
            ("groupless", "Groupless"),  # Student is in no groups at all
        ),
        method="filter_by_group_status",
        label="Guruhdagi holati",
    )

    # Filter by teacher ID
    teacher_id = django_filters.NumberFilter(
        field_name="group_memberships__group__teacher__id", distinct=True
    )
    class Meta:
        model = Student
        fields = ["branch", "payment_status", "group_status", "teacher_id", "group_id"]

    def filter_by_group_status(self, queryset, name, value):
        today = timezone.now().date()

        if value == "groupless":
            # Easiest case: find students with no StudentGroup memberships at all.
            return queryset.filter(group_memberships__isnull=True).distinct()

        # For 'active' and 'inactive', we need a more advanced query.
        # We will use a Subquery with Exists to check for the condition.

        # This subquery finds "active" enrollments for a student. An enrollment is active if:
        # 1. The StudentGroup itself is not archived.
        # 2. The Group it links to is not archived.
        # 3. Today's date is between the group's start and end dates.
        active_enrollment_subquery = StudentGroup.objects.filter(
            student=OuterRef("pk"),  # Link to the outer Student query
            is_archived=False,  # The enrollment is active
            group__is_archived=False,  # The group is active
            group__start_date__lte=today,  # The group has started
            group__end_date__gte=today,  # The group has not ended yet
        )

        if value == "active":
            # Find students who have AT LEAST ONE active enrollment.
            return (
                queryset.annotate(
                    has_active_enrollment=Exists(active_enrollment_subquery)
                )
                .filter(has_active_enrollment=True)
                .distinct()
            )

        if value == "inactive":
            # This is the most complex case. An "inactive" student is one who:
            # 1. Is NOT groupless (they must have at least one past enrollment).
            # 2. Has NO active enrollments.
            return (
                queryset.filter(group_memberships__isnull=False)
                .annotate(has_active_enrollment=Exists(active_enrollment_subquery))
                .filter(has_active_enrollment=False)
                .distinct()
            )

        return queryset

    def filter_by_payment_status(self, queryset, name, value):
        # The queryset is already annotated with 'balance' from the ViewSet
        queryset = queryset.annotate(
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

        if value == "debtor":
            # "Qarzdor": Students whose balance is less than zero
            return queryset.filter(balance__lt=0)

        if value == "overpaid":
            # "Ortiqcha to'lov": Students whose balance is greater than zero
            return queryset.filter(balance__gt=0)

        if value == "due_soon":
            # "To'lovi yaqin": This is a more complex logic.
            # We need to find students who have a cheque due in the next 7 days
            # AND whose balance is not enough to cover it.
            # NOTE: This logic assumes your 'Cheque' model has a 'due_date' field.
            # If not, you'll need to adjust this.
            today = timezone.now().date()
            due_date_start = today - timedelta(days=30)
            due_date_end = today - timedelta(days=23)

            # 2. We use an Exists subquery to find students who meet ALL conditions.
            #    This is the most efficient way to perform this complex check.
            due_soon_subquery = StudentGroup.objects.filter(
                student=OuterRef("pk"),  # Link to the outer Student query
                # Condition A: The enrollment must be currently active
                is_archived=False,
                group__is_archived=False,
                group__start_date__lte=today,
                group__end_date__gte=today,
                # Condition B: The latest monthly fee for THIS enrollment must be in our "due soon" window
                transactions__category="MONTHLY_FEE",
                transactions__created_at__date__range=(due_date_start, due_date_end),
            )

            # 3. Annotate the main queryset with the result of the subquery
            #    and filter for students where such an enrollment exists.
            return queryset.annotate(is_due_soon=Exists(due_soon_subquery)).filter(
                is_due_soon=True
            )

        return queryset

    def filter_exclude_groups(self, queryset, name, value):
        """
        Excludes students who are already members of the groups specified in the 'value'.
        'value' is expected to be a comma-separated string of group IDs (e.g., "5,12,3").
        """
        if not value:
            return queryset

        try:
            # Convert the comma-separated string into a list of integers
            group_ids = [int(gid) for gid in value.split(",")]
        except (ValueError, TypeError):
            # If the value is invalid, just ignore the filter
            return queryset

        # --- THE CORE LOGIC ---
        # This will return only the students whose ID is NOT in the list of
        # students already enrolled in the specified groups.
        return queryset.exclude(group_memberships__group__id__in=group_ids)


class GroupFilter(django_filters.FilterSet):
    """
    Custom filter for the Group model.
    """

    # Allows filtering by teacher ID, e.g., /api/core/groups/?teacher=5
    teacher = django_filters.NumberFilter(field_name="teacher__id")
    # Allows filtering by branch ID, e.g., /api/core/groups/?branch=2
    branch = django_filters.NumberFilter(field_name="branch__id")
    # Allows filtering by room ID, e.g., /api/core/groups/?room=10
    room = django_filters.NumberFilter(field_name="room__id")
    # It accepts a single student ID.
    exclude_student = django_filters.NumberFilter(method="filter_exclude_student")

    weekdays = django_filters.ChoiceFilter(
        choices=(
            ("135", "Toq kunlar"),
            ("246", "Juft kunlar"),
            ("1234567", "Har kuni"),
        ),
        field_name="weekdays",
        label="Guruhdagi holati",
    )

    class Meta:
        model = Group
        fields = ["teacher", "branch", "room", "exclude_student"]

    def filter_exclude_student(self, queryset, name, value):
        """
        Excludes groups that the student with the given ID ('value') is already enrolled in.
        """
        if not value:
            return queryset

        try:
            student_id = int(value)
        except (ValueError, TypeError):
            return queryset  # Ignore invalid values

        # --- THE CORE LOGIC ---
        # This returns only the groups whose ID is NOT in the list of groups
        # that this student is already a member of.
        return queryset.exclude(students__student__id=student_id)
