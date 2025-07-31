from user_agents import parse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q, Prefetch
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.filters import OrderingFilter, SearchFilter

from core.models import Group
from .models import User, LoginLog
from .permissions import IsAuthenticatedOrAdminForUnsafe, IsCeoForUnsafe, IsAdminUser
from .serializers import (
    MyTokenObtainPairSerializer,
    UserSerializer,
    PhoneNumberChangeSerializer,
    ProfileUpdateSerializer,
    PasswordChangeSerializer,
    TeacherPageSerializer,
)


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Handles user login, token generation, and logs the login event.
    """

    serializer_class = MyTokenObtainPairSerializer

    def get_serializer_context(self):
        #  Pass request to serializer context
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def post(self, request, *args, **kwargs):
        # Use the parent class's post method to validate credentials and get tokens
        response = super().post(request, *args, **kwargs)

        # If login is successful (status code 200), create a log entry
        if response.status_code == 200:
            try:
                # Find the user who just logged in
                user = User.objects.get(phone_number=request.data["phone_number"])

                # Parse user agent string from request headers
                user_agent_string = request.META.get("HTTP_USER_AGENT", "")
                user_agent = parse(user_agent_string)
                ip_address = request.META.get("REMOTE_ADDR")

                # Create the log entry
                LoginLog.objects.create(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent_string,
                    device=user_agent.device.family,
                    browser=user_agent.browser.family,
                    os=user_agent.os.family,
                )
            except User.DoesNotExist:
                # This case is unlikely if login succeeded, but good for safety
                pass
            except Exception as e:
                # Log potential errors during the logging process without failing the login
                print(f"Error creating login log: {e}")

        return response


class CurrentUserView(APIView):
    """
    An endpoint to get the currently authenticated user's details.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UpdateProfileView(generics.UpdateAPIView):
    """
    Updates the profile (full_name, profile_photo) of the logged-in user.
    """

    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Needed for file uploads

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        """
        Overrides the default partial_update to ensure file is handled correctly.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # --- THIS IS THE FIX ---
        # The serializer.save() method will now correctly handle the update
        # for both full_name and the profile_photo file.
        self.perform_update(serializer)

        # It's good practice to return the updated user data in the response.
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdatePhoneNumberView(generics.GenericAPIView):
    """
    Changes the phone number of the logged-in user.
    Requires the current password for security.
    """

    serializer_class = PhoneNumberChangeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "detail": "Telefon raqami muvaffaqiyatli o'zgartirildi. Iltimos, yangi raqam bilan qayta tizimga kiring."
            },
            status=status.HTTP_200_OK,
        )


class UpdatePasswordView(generics.GenericAPIView):
    """
    Changes the password of the logged-in user.
    """

    serializer_class = PasswordChangeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password updated successfully"}, status=status.HTTP_200_OK
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    A single ViewSet for managing all Users (CEOs, Admins, Teachers).
    Supports filtering by role using query parameters like:
    - /api/users/?is_teacher=true
    - /api/users/?is_admin=true
    """

    permission_classes = [IsCeoForUnsafe]
    pagination_class = (
        PageNumberPagination  # Make sure this is imported or configured in settings.py
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    serializer_class = UserSerializer
    filterset_fields = [
        "is_admin",
        "is_teacher",
        "is_ceo",
    ]
    ordering_fields = ["full_name", "enrollment_date", "salary", "percentage"]
    ordering = ["-id"]

    def get_queryset(self):
        """
        Dynamically filters the queryset based on query parameters.
        """
        queryset = User.objects.all()
        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return queryset.filter(is_active=not is_archived)

    # def get_permissions(self):
    #     """
    #     Instantiates and returns the list of permissions that this view requires.
    #     - Listing/Creating requires admin-level (CEO) access.
    #     - Retrieving/Updating/Deleting requires CEO or self-access.
    #     """
    #     if self.action == 'list' or self.action == 'create':
    #         permission_classes = [IsAdminUser]
    #     else:
    #         permission_classes = [IsAuthenticatedOrAdminForUnsafe]

    #     return [permission() for permission in permission_classes]

    def get_object(self):
        queryset = User.objects.filter()
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Custom action to archive (soft delete) a user."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({"status": "User archived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Custom action to restore an archived user."""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({"status": "User restored"}, status=status.HTTP_200_OK)


class UserRoleCountsView(APIView):
    """
    Returns the count of active users for each major role.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # We use conditional aggregation to get all counts in a single query.
        active_counts = User.objects.filter(is_active=True).aggregate(
            all=Count("id"),
            admin=Count("id", filter=Q(is_admin=True)),
            teacher=Count("id", filter=Q(is_teacher=True)),
            ceo=Count("id", filter=Q(is_ceo=True)),
        )
        archived_counts = User.objects.filter(is_active=False).aggregate(
            all=Count("id"),
            admin=Count("id", filter=Q(is_admin=True)),
            teacher=Count("id", filter=Q(is_teacher=True)),
            ceo=Count("id", filter=Q(is_ceo=True)),
        )
        data = {
            "active": {
                "all": active_counts.get("all", 0),
                "admin": active_counts.get("admin", 0),
                "teacher": active_counts.get("teacher", 0),
                "ceo": active_counts.get("ceo", 0),
            },
            "archived": {
                "all": archived_counts.get("all", 0),
                "admin": archived_counts.get("admin", 0),
                "teacher": archived_counts.get("teacher", 0),
                "ceo": archived_counts.get("ceo", 0),
            },
        }

        return Response(data)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    Provides a list of all teachers with their active group and student counts.
    This view does not use pagination, returning all teachers at once.
    """

    serializer_class = TeacherPageSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        today = timezone.now().date()
        queryset = User.objects.filter(is_teacher=True).annotate(
            active_groups_count=Count(
                "courses",
                filter=Q(
                    courses__is_archived=False,
                    courses__start_date__lte=today,
                    courses__end_date__gte=today,
                ),
                distinct=True,
            ),
            active_students_count=Count(
                "courses__students",
                filter=Q(
                    courses__is_archived=False,
                    courses__start_date__lte=today,
                    courses__end_date__gte=today,
                ),
                distinct=True,
            ),
        )

        is_archived = (
            self.request.query_params.get("is_archived", "false").lower() == "true"
        )
        return queryset.filter(is_active=not is_archived)

    def get_object(self):
        queryset = User.objects.filter(is_teacher=True)
        obj = generics.get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Custom action to archive (soft delete) a teacher."""
        teacher = self.get_object()
        teacher.is_active = False
        teacher.save()
        return Response({"status": "teacher archived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Custom action to restore an archived teacher."""
        teacher = self.get_object()
        teacher.is_active = True
        teacher.save()
        return Response({"status": "teacher restored"}, status=status.HTTP_200_OK)
