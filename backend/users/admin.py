from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from import_export.admin import ImportExportModelAdmin

from .models import User, LoginLog


admin.site.unregister(Group)


class LoginLogInline(admin.TabularInline):
    model = LoginLog
    fields = ("login_time", "ip_address", "browser", "os", "device")
    readonly_fields = ("login_time", "ip_address", "browser", "os", "device")
    extra = 0
    can_delete = False
    verbose_name = "Login Record"
    verbose_name_plural = "Login History"


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    list_display = ("user", "login_time", "ip_address", "browser", "os", "device")
    search_fields = ("user__full_name", "ip_address", "user_agent")
    list_filter = ("browser", "os")


class UserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("full_name", "phone_number", "profile_photo")

    def clean_password2(self):
        pw1 = self.cleaned_data.get("password1")
        pw2 = self.cleaned_data.get("password2")
        if pw1 and pw2 and pw1 != pw2:
            raise forms.ValidationError("Passwords don't match")
        return pw2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    class Meta:
        model = User
        fields = (
            "full_name",
            "phone_number",
            "profile_photo",
            "enrollment_date",
            "is_active",
        )


@admin.register(User)
class UserAdmin(ImportExportModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    inlines = [LoginLogInline]

    list_display = (
        "full_name",
        "formatted_phone",
        "photo_tag",
        "is_active",
        "is_ceo",
        "is_admin",
        "is_teacher",
    )
    list_filter = ("is_active", "is_ceo", "is_admin", "is_teacher")

    search_fields = ("full_name", "phone_number")
    ordering = ("-id",)
    readonly_fields = ("photo_tag",)

    fieldsets = (
        (None, {"fields": ("full_name", "phone_number", "profile_photo", "photo_tag")}),
        ("System Roles", {"fields": ("is_active", "is_ceo", "is_teacher", "is_admin")}),
        ("Staff info", {"fields": ("enrollment_date", "salary", "percentage")}),
        ("Permissions", {"fields": ("is_superuser", "user_permissions")}),
        ("Logins", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "full_name",
                    "phone_number",
                    "profile_photo",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    def formatted_phone(self, obj):
        return f"+{obj.phone_number}" if obj.phone_number else "-"

    formatted_phone.short_description = "Phone Number"

    def photo_tag(self, obj):
        if obj.profile_photo:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit: cover; border-radius: 50%;" />',
                obj.profile_photo.url,
            )
        return "-"

    photo_tag.short_description = "Photo"
