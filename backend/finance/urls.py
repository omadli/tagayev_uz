from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupPriceViewSet, PaymentTypeViewSet, TransactionViewSet

# Create a router
router = DefaultRouter()
# Register our new ViewSet
router.register(r"group-prices", GroupPriceViewSet, basename="groupprice")
router.register(r"payment-types", PaymentTypeViewSet, basename="paymenttype")
router.register(r"transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
]
