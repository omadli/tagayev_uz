from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from users.permissions import IsAuthenticatedOrAdminForUnsafe
from .models import GroupPrice, PaymentType, Transaction
from .serializers import (
    GroupPriceSerializer,
    PaymentTypeSerializer,
    PaymentCreateSerializer,
)


class GroupPriceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing the price history of groups.
    Allows creating new price points and listing the history for a specific group.
    """

    serializer_class = GroupPriceSerializer
    permission_classes = [IsAuthenticatedOrAdminForUnsafe]
    # Allow filtering by group ID, e.g., /api/finance/group-prices/?group=5
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["group"]

    def get_queryset(self):
        """
        Return all price history records, ordered by the most recent start date.
        """
        return GroupPrice.objects.all().order_by("start_date")


class PaymentTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payment Types (Naqd, Click, etc.).
    Only accessible to staff/admin users.
    """

    serializer_class = PaymentTypeSerializer
    permission_classes = [
        IsAuthenticatedOrAdminForUnsafe
    ]  # Ensures only CEO/Admins can manage

    def get_queryset(self):
        """
        Optionally filter by active status.
        e.g., /api/finance/payment-types/?is_active=true
        """
        queryset = PaymentType.objects.all()
        is_active = self.request.query_params.get("is_active")
        if is_active in ["true", "True"]:
            return queryset.filter(is_active=True)
        return queryset


class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for creating financial Transactions.
    For now, it's primarily used for creating payment (CREDIT) transactions.
    """

    serializer_class = PaymentCreateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Transaction.objects.all()
    http_method_names = [
        "post"
    ]  # Only allow creating transactions via this endpoint for now

    def get_serializer_context(self):
        """
        Pass the request object to the serializer context.
        This is needed to automatically set the 'created_by' user.
        """
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
