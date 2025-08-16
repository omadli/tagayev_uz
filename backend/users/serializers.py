from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from core.models import Branch


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customizes the JWT token to include user's full name, phone number, and roles.
    """

    def get_token(self, user):
        token = super().get_token(user)

        # Add custom claims to the token payload
        token["full_name"] = user.full_name
        token["phone_number"] = str(user.phone_number)
        token["roles"] = user.roles  # Uses the @property in your User model

        # Add profile photo URL
        request = self.context.get("request")
        if user.profile_photo and hasattr(user.profile_photo, "url"):
            token["profile_photo"] = request.build_absolute_uri(user.profile_photo.url)
        else:
            token["profile_photo"] = None

        return token


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning user data on authenticated endpoints.
    """

    class Meta:
        model = User
        fields = [
            # Base Info
            "id",
            "full_name",
            "phone_number",
            "profile_photo",
            "roles",
            # Roles / Status
            "is_active",
            "is_ceo",
            "is_admin",
            "is_teacher",
            # Staff-related Info
            "enrollment_date",
            "salary",
            "percentage",
            # Password (write-only for security)
            "password",
        ]

        # Make password write-only and not required for updates.
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
        }

    def create(self, validated_data):
        """
        Handles creation of any type of user.
        The user manager correctly handles password hashing.
        """
        validated_data["is_active"] = True
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        """
        Handles updates. If a new password is provided, it will be hashed.
        Otherwise, the password remains unchanged.
        """
        # If 'password' is in the data, it needs special handling.
        password = validated_data.pop("password", None)

        # Use the default update method for all other fields.
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "profile_photo"]
        # Make full_name optional for PATCH requests
        extra_kwargs = {
            "full_name": {"required": False},
        }


class PhoneNumberChangeSerializer(serializers.Serializer):
    """
    Serializer for changing the user's phone number.
    Requires the current password for verification.
    """

    current_password = serializers.CharField(required=True, write_only=True)
    new_phone_number = serializers.IntegerField(required=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Eski parol noto'g'ri kiritildi.")
        return value

    def validate_new_phone_number(self, value):
        # Use the model's built-in validators by creating a temporary user instance
        try:
            # We don't save this user, just use it to run the model's validators
            temp_user = User(
                phone_number=value, full_name="temp", password="TempPassword1234%$*"
            )
            temp_user.full_clean(["phone_number"])
        except Exception as e:
            # Catch any validation errors from the model
            raise serializers.ValidationError(e)

        # Check for uniqueness
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(
                "Bu telefon raqami allaqachon ro'yxatdan o'tgan."
            )

        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.phone_number = self.validated_data["new_phone_number"]
        user.save()
        return user


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "Your old password was entered incorrectly. Please enter it again."
            )
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class TeacherPageSerializer(serializers.ModelSerializer):
    active_groups_count = serializers.IntegerField(read_only=True)
    active_students_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "phone_number",
            "profile_photo",
            "is_active",
            "enrollment_date",
            "salary",
            "percentage",
            "active_groups_count",
            "active_students_count",
            "password",  # This will be write-only
        ]
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
        }

    def create(self, validated_data):
        validated_data["is_teacher"] = True
        validated_data["is_active"] = True
        user: User = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        """
        Handles updates. If a new password is provided, it will be hashed.
        Otherwise, the password remains unchanged.
        """
        # If 'password' is in the data, it needs special handling.
        password = validated_data.pop("password", None)

        # Use the default update method for all other fields.
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user

    def validate(self, data):
        """
        Custom validation to handle the salary/percentage logic.
        """
        salary = data.get("salary")
        percentage = data.get("percentage")

        # If both are provided, raise an error.
        if salary is not None and percentage is not None:
            raise serializers.ValidationError(
                "Faqat Oylik yoki Foizdan bittasini kiriting."
            )

        # If neither is provided, default percentage to 70.
        if salary is None and percentage is None:
            data["percentage"] = 70.00
            data["salary"] = None

        return data

    def get_active_groups_count(self, obj):
        return obj.courses.filter(is_archived=False).count()

    def get_active_students_count(self, obj):
        return (
            obj.courses.filter(is_archived=False).values("students").distinct().count()
        )
