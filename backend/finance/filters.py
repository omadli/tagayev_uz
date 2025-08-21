import django_filters
from .models import Transaction


class TransactionFilter(django_filters.FilterSet):
    # Allow filtering by group ID, e.g., ?group=5
    group = django_filters.NumberFilter(field_name="student_group__group__id")
    branch = django_filters.NumberFilter(field_name="student_group__group__branch__id")
    # Allow filtering by student ID, e.g., ?student=12
    student = django_filters.NumberFilter(field_name="student_group__student__id")
    payment_type = django_filters.NumberFilter(field_name="payment_type__id")

    start_date = django_filters.DateFilter(
        field_name="created_at__date", lookup_expr="gte"
    )
    end_date = django_filters.DateFilter(
        field_name="created_at__date", lookup_expr="lte"
    )

    class Meta:
        model = Transaction
        fields = [
            "branch",
            "group",
            "student",
            "transaction_type",
            "category",
            "start_date",
            "end_date",
            "receiver",
            "payment_type",
            "category",
        ]
