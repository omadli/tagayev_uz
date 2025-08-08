from django.contrib import admin
from .models import GroupPrice, PaymentType, Transaction
from import_export.admin import ImportExportModelAdmin


@admin.register(GroupPrice)
class GroupPriceAdmin(ImportExportModelAdmin):
    list_display = ("group", "price", "start_date")
    list_filter = ("start_date", "group__branch")
    search_fields = ("group__name",)
    ordering = ("-start_date",)


@admin.register(PaymentType)
class PaymentTypeAdmin(ImportExportModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Transaction)
class TransactionAdmin(ImportExportModelAdmin):
    list_display = (
        "student_group",
        "transaction_type",
        "category",
        "amount_display",
        "payment_type",
        "receiver",
        "created_at",
    )
    list_filter = ("transaction_type", "category", "payment_type", "created_at")
    search_fields = (
        "student_group__student__full_name",
        "student_group__group__name",
        "receiver__full_name",
    )
    autocomplete_fields = ("student_group", "receiver", "created_by")
    list_select_related = (
        "student_group__student",
        "student_group__group",
        "payment_type",
        "receiver",
    )

    # Make the form a bit more user-friendly
    fieldsets = (
        (
            None,
            {"fields": ("student_group", ("transaction_type", "category"), "amount")},
        ),
        (
            "To'lov ma'lumotlari (Faqat \"To'lov\" kategoriyasi uchun)",
            {
                "classes": ("collapse",),  # Collapsible by default
                "fields": ("payment_type", "receiver"),
            },
        ),
        (
            "Qo'shimcha",
            {
                "fields": ("comment", "created_by", "created_at"),
            },
        ),
    )

    readonly_fields = ("created_at",)

    def save_model(self, request, obj, form, change):
        # Automatically set the 'created_by' field to the current user
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description="Amount")
    def amount_display(self, obj: Transaction):
        amount = obj.amount
        return f"{amount:0,.2f}"