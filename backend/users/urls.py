# backend/users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, TeacherViewSet
from .views import (
    MyTokenObtainPairView,
    CurrentUserView,
    UpdatePhoneNumberView,
    UpdateProfileView,
    UpdatePasswordView,
    UserRoleCountsView,
)


router = DefaultRouter()
# Register the UserViewSet at the '/users/' endpoint
router.register(r"users", UserViewSet, basename="user")
router.register(r"teachers", TeacherViewSet, basename="teacher")


urlpatterns = [
    # Use 'login/' for clarity instead of 'token/'
    path("login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("profile/update/", UpdateProfileView.as_view(), name="update-profile"),
    path("password/change/", UpdatePasswordView.as_view(), name="change-password"),
    path("phone/change/", UpdatePhoneNumberView.as_view(), name="change-phone"),
    path("role-counts/", UserRoleCountsView.as_view(), name="user-role-counts"),
    path("", include(router.urls)),
]
