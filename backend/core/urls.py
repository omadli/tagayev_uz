# backend/core/urls.py
from django.urls import path, include
from .views import DashboardStatsView, GlobalSearchView, DailyAiStatsView

from rest_framework.routers import DefaultRouter
from .views import StudentEnrollmentListView
from .views import (
    StudentViewSet,
    GroupViewSet,
    BranchViewSet,
    RoomViewSet,
    StudentGroupViewSet,
)

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")
router.register(r"groups", GroupViewSet, basename="group")
router.register(r"branches", BranchViewSet, basename="branch")
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"enrollments", StudentGroupViewSet, basename="studentgroup")


urlpatterns = [
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("global-search/", GlobalSearchView.as_view(), name="global-search"),
    path("ai-daily-stats/", DailyAiStatsView.as_view(), name="ai-daily-stats"),
    path(
        "student-enrollments/",
        StudentEnrollmentListView.as_view(),
        name="student-enrollments",
    ),
    path("", include(router.urls)),
]
