from rest_framework import serializers
from .models import GroupPrice, PaymentType, Transaction
from core.models import Group, StudentGroup
from users.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from datetime import timedelta


class GroupPriceSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and listing GroupPrice records.
    """

    # Use PrimaryKeyRelatedField for writing, but we'll show the group name on read.
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = GroupPrice
        fields = ["id", "group", "group_name", "price", "start_date", "created_at"]
        # Make 'group' field write-only as we display 'group_name'
        extra_kwargs = {"group": {"write_only": True}}

    def validate_start_date(self, value):
        """
        Custom validation for the start_date field.
        """
        if self.instance:  # 'self.instance' exists only during an update
            four_days_ago = timezone.now().date() - timedelta(days=4)
            if self.instance.start_date <= four_days_ago:
                raise serializers.ValidationError(
                    "O'tgan 4 kundan eski narxlarni o'zgartirib bo'lmaydi."
                )
        return value

    def validate(self, data):
        """
        Check for uniqueness constraint. A group cannot have two different prices
        starting on the same day.
        """
        group = data.get("group")
        start_date = data.get("start_date")

        group = data.get("group") or self.instance.group

        #  Check if the new price's start_date is within the group's lifetime.
        if not (group.start_date <= start_date <= group.end_date):
            raise serializers.ValidationError(
                {
                    "start_date": f"Sana guruhning mavjudlik oralig'ida bo'lishi kerak ({group.start_date} dan {group.end_date} gacha)."
                }
            )

        if GroupPrice.objects.filter(group=group, start_date=start_date).exists():
            raise serializers.ValidationError(
                {"start_date": f"Bu sana ({start_date}) uchun narx allaqachon mavjud."}
            )
        return data

    def create(self, validated_data):
        instance = GroupPrice(**validated_data)
        # instance.full_clean()  # runs clean_fields and clean
        instance.save()
        return instance


class PaymentTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the PaymentType model.
    """

    # These are read-only fields populated by the ViewSet annotation
    current_month_total = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    last_month_total = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = PaymentType
        fields = ["id", "name", "is_active", "current_month_total", "last_month_total"]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for creating a new PAYMENT Transaction.
    """

    # We accept IDs from the frontend
    student_group = serializers.PrimaryKeyRelatedField(
        queryset=StudentGroup.objects.all()
    )
    payment_type = serializers.PrimaryKeyRelatedField(
        queryset=PaymentType.objects.filter(is_active=True)
    )
    receiver = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True)
    )

    class Meta:
        model = Transaction
        fields = [
            "student_group",
            "amount",
            "payment_type",
            "receiver",
            "comment",
            "created_at",  # Allow frontend to specify payment date
        ]

        extra_kwargs = {
            "transaction_type": {"read_only": True},
            "category": {"read_only": True},
        }

    def create(self, validated_data):
        """
        Overrides the create method to set required fields for a payment.
        """

        # Get the current user from the context (set in the view)
        created_by_user: User = self.context["request"].user
        receiver: User = validated_data["receiver"]
        if created_by_user != receiver and not (
            created_by_user.is_ceo or created_by_user.is_superuser
        ):
            raise serializers.ValidationError(
                "Siz boshqa xodimlar nomidan to'lov yarata olmaysiz"
            )
        # Hardcode the fields for a PAYMENT transaction
        validated_data["transaction_type"] = Transaction.TransactionType.CREDIT
        validated_data["category"] = Transaction.TransactionCategory.PAYMENT
        validated_data["created_by"] = created_by_user

        # The model's clean method will be called on save, ensuring receiver/type are correct.
        transaction = Transaction.objects.create(**validated_data)
        return transaction


class TransactionDetailSerializer(serializers.ModelSerializer):
    group_id = serializers.IntegerField(source="student_group.group.id", read_only=True)
    group_name = serializers.CharField(
        source="student_group.group.name", read_only=True
    )
    student_id = serializers.IntegerField(
        source="student_group.student.id", read_only=True
    )
    student_name = serializers.CharField(
        source="student_group.student.full_name", read_only=True
    )
    payment_type_id = serializers.IntegerField(source="payment_type.id", read_only=True)
    payment_type_name = serializers.CharField(
        source="payment_type.name",
        read_only=True,
    )
    receiver_id = serializers.IntegerField(source="receiver.id", read_only=True)
    receiver_name = serializers.CharField(
        source="receiver.full_name",
        read_only=True,
    )
    created_by_id = serializers.IntegerField(source="created_by.id", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "transaction_type",
            "category",
            "amount",
            "comment",
            "created_at",
            "updated_at",
            # group & student
            "group_id",
            "group_name",
            "student_id",
            "student_name",
            # payment
            "payment_type_id",
            "payment_type_name",
            "receiver_id",
            "receiver_name",
            # audit
            "created_by_id",
            "created_by_name",
        ]
