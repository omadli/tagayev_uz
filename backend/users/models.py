from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator


class BaseModel(models.Model):
    is_archived = models.BooleanField(default=False)
    archived_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserManager(BaseUserManager):
    def create_user(self, phone_number, full_name, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("Phone number is required.")
        if len(str(phone_number)) != 12:
            raise ValueError("Phone number must be Uzbekistan numbers")
        if not str(phone_number).startswith("998"):
            raise ValueError("Phone number must start with 998.")
        user = self.model(
            phone_number=phone_number, full_name=full_name, **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_ceo", True)
        return self.create_user(phone_number, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    phone_number = models.BigIntegerField(
        unique=True,
        db_index=True,
        validators=[
            MinValueValidator(
                100000000000, message="Telefon raqami 12 xonali bo'lishi kerak."
            ),
            MaxValueValidator(
                999999999999, message="Telefon raqami 12 xonali bo'lishi kerak."
            ),
            RegexValidator(
                regex=r"^998",
                message="Telefon raqami '998' bilan boshlanishi kerak.",
                code="invalid_country_code",
            ),
        ],
        help_text="Phone number without country code, e.g., 998901234567",
    )
    full_name = models.CharField(max_length=150, db_index=True)
    profile_photo = models.ImageField(upload_to="users/photos/", blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_ceo = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_teacher = models.BooleanField(default=False)

    enrollment_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date the staff started working",
    )
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} ({self.phone_number})"

    @property
    def is_staff(self):
        return self.is_ceo or self.is_superuser

    @property
    def roles(self):
        roles = []
        if self.is_ceo:
            roles.append("CEO")
        if self.is_admin:
            roles.append("Admin")
        if self.is_teacher:
            roles.append("Teacher")
        return roles


class LoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_logs")
    login_time = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device = models.CharField(max_length=200, blank=True)
    browser = models.CharField(max_length=200, blank=True)
    os = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-login_time"]
        verbose_name = "Login Log"
        verbose_name_plural = "Login Logs"

    def __str__(self):
        return f"{self.user.full_name} - {self.login_time}"
