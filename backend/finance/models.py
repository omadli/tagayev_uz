from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

from users.models import User
from core.models import StudentGroup, Group


class GroupPrice(models.Model):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="price_history",
        help_text="Group for which this price applies",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price of the course starting from this date",
    )
    start_date = models.DateField(help_text="Date from which this price becomes active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("group", "start_date")
        ordering = ["-start_date"]
        verbose_name = "Kurs narxi"
        verbose_name_plural = "Kurs narxlari"

    def __str__(self):
        return f"{self.group.name} → {self.price} UZS from {self.start_date}"


class PaymentType(models.Model):
    """
    CEO can control payment types (Naqd, Click, Payme, etc.).
    """

    name = models.CharField(max_length=50, unique=True, verbose_name="To'lov turi nomi")
    is_active = models.BooleanField(default=True, verbose_name="Aktiv")

    class Meta:
        verbose_name = "To'lov Turi"
        verbose_name_plural = "To'lov Turlari"

    def __str__(self):
        return self.name


class Transaction(models.Model):
    """
    The central model for all financial activity, linked to a specific group enrollment.
    """

    class TransactionType(models.TextChoices):
        DEBIT = "DEBIT", "Debit (Qarz)"
        CREDIT = "CREDIT", "Credit (To'lov)"

    class TransactionCategory(models.TextChoices):
        MONTHLY_FEE = "MONTHLY_FEE", "Oylik to'lov"
        PAYMENT = "PAYMENT", "To'lov"
        DISCOUNT = "DISCOUNT", "Chegirma"
        BONUS = "BONUS", "Bonus"
        REFUND = "REFUND", "Pulni qaytarish"
        OTHER_FEE = "OTHER_FEE", "Boshqa to'lovlar uchun"

    student_group = models.ForeignKey(
        StudentGroup,
        on_delete=models.PROTECT,
        related_name="transactions",
        verbose_name="O'quvchi guruhi",
    )

    transaction_type = models.CharField(
        max_length=6, choices=TransactionType.choices, verbose_name="Tranzaksiya turi"
    )
    category = models.CharField(
        max_length=20, choices=TransactionCategory.choices, verbose_name="Kategoriya"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Always a positive value.",
        verbose_name="Summa",
    )

    payment_type = models.ForeignKey(
        PaymentType,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="To'lov turi",
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="received_transactions",
        verbose_name="Qabul qiluvchi",
    )

    comment = models.TextField(blank=True, verbose_name="Izoh")
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan vaqti",
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="O'zgartirish kiritilgan vaqti"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_transactions",
        verbose_name="Kim tomonidan yaratildi",
    )

    class Meta:
        verbose_name = "Tranzaksiya"
        verbose_name_plural = "Tranzaksiyalar"
        indexes = [
            models.Index(fields=["student_group", "category", "created_at"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["category"]),
            models.Index(fields=["transaction_type"]),
        ]
        ordering = ["-created_at"]
        ordering = ["-created_at"]

    def __str__(self):
        student = self.student_group.student.full_name
        group = self.student_group.group.name
        sign = "-" if self.transaction_type == "DEBIT" else "+"
        return f"[{student} / {group}]: {sign}{self.amount} ({self.get_category_display()})"

    def clean(self):
        # Enforce that payment_type and receiver are ONLY set for PAYMENT transactions
        if self.category == self.TransactionCategory.PAYMENT:
            if not self.payment_type or not self.receiver:
                raise ValidationError(
                    "To'lov tranzaktsiyalari uchun 'To'lov turi' va 'Qabul qiluvchi' majburiy."
                )
            self.transaction_type = (
                self.TransactionType.CREDIT
            )  # Force payments to be credits
        else:
            if self.payment_type or self.receiver:
                raise ValidationError(
                    "'To'lov turi' va 'Qabul qiluvchi' faqat to'lov tranzaktsiyalari uchun ishlatiladi."
                )

        # Force discounts and bonuses to be credits
        if self.category in [
            self.TransactionCategory.DISCOUNT,
            self.TransactionCategory.BONUS,
        ]:
            self.transaction_type = self.TransactionType.CREDIT

        # Force fees to be debits
        if self.category in [
            self.TransactionCategory.MONTHLY_FEE,
            self.TransactionCategory.OTHER_FEE,
        ]:
            self.transaction_type = self.TransactionType.DEBIT
