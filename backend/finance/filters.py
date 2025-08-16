import django_filters
from .models import Transaction


class TransactionFilter(django_filters.FilterSet):
    # Allow filtering by group ID, e.g., ?group=5
    group = django_filters.NumberFilter(field_name="student_group__group__id")
    # Allow filtering by student ID, e.g., ?student=12
    student = django_filters.NumberFilter(field_name="student_group__student__id")

    start_date = django_filters.DateFilter(
        field_name="created_at__date", lookup_expr="gte"
    )
    end_date = django_filters.DateFilter(
        field_name="created_at__date", lookup_expr="lte"
    )

    class Meta:
        model = Transaction
        fields = [
            "group",
            "student",
            "transaction_type",
            "category",
            "start_date",
            "end_date",
        ]
