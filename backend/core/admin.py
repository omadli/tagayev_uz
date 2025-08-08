from django import forms
from django.contrib import admin
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from .models import (
    Branch,
    Room,
    Student,
    Parent,
    Group,
    StudentGroup,
    Attendance,
    Holiday,
    GroupScheduleOverride,
)


@admin.register(Branch)
class BranchAdmin(ImportExportModelAdmin):
    list_display = ("name", "address", "is_archived", "created_at")
    search_fields = ("name", "address")
    list_filter = ("is_archived",)
    ordering = ("-created_at",)


@admin.register(Room)
class RoomAdmin(ImportExportModelAdmin):
    list_display = ("name", "branch", "capacity", "is_archived")
    search_fields = ("name",)
    list_filter = ("branch", "is_archived")


@admin.register(Student)
class StudentAdmin(ImportExportModelAdmin):
    list_display = (
        "photo_tag",
        "full_name",
        "formatted_phone",
        "gender",
        "branch",
        "is_archived",
    )
    list_display_links = ("photo_tag", "full_name", "formatted_phone")
    search_fields = ("full_name", "phone_number")
    list_filter = ("branch", "gender", "is_archived")
    readonly_fields = ("photo_tag",)
    autocomplete_fields = ("branch",)

    @admin.display(description="Phone")
    def formatted_phone(self, obj):
        return f"+{obj.phone_number}"

    @admin.display(description="Photo")
    def photo_tag(self, obj):
        if obj.profile_photo:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit: cover; border-radius: 50%;" />',
                obj.profile_photo.url,
            )
        return "-"


@admin.register(Parent)
class ParentAdmin(ImportExportModelAdmin):
    list_display = ("full_name", "formatted_phone", "student", "gender")
    search_fields = ("full_name", "phone_number", "student__full_name")
    list_filter = ("gender",)
    autocomplete_fields = ("student",)

    def formatted_phone(self, obj):
        return f"+{obj.phone_number}"

    formatted_phone.short_description = "Phone"


WEEKDAYS = [
    ("1", "Monday"),
    ("2", "Tuesday"),
    ("3", "Wednesday"),
    ("4", "Thursday"),
    ("5", "Friday"),
    ("6", "Saturday"),
    ("7", "Sunday"),
]


class WeekdayMultiSelect(forms.MultipleChoiceField):
    def __init__(self, *args, **kwargs):
        super().__init__(
            choices=WEEKDAYS, widget=forms.CheckboxSelectMultiple, *args, **kwargs
        )

    def clean(self, value):
        value = super().clean(value)
        if len(set(value)) != len(value):
            raise forms.ValidationError("Duplicate days selected.")
        return "".join(sorted(value))


class GroupAdminForm(forms.ModelForm):
    weekdays = WeekdayMultiSelect()

    class Meta:
        model = Group
        fields = "__all__"

    def clean_weekdays(self):
        # Already handled in WeekdayMultiSelect
        return self.cleaned_data["weekdays"]


@admin.register(Group)
class GroupAdmin(ImportExportModelAdmin):
    list_display = (
        "name",
        "branch",
        "teacher",
        "room",
        "start_date",
        "price",
        "colored_box",
        "text_colored_box",
        "weekdays",
    )
    search_fields = ("name", "teacher__full_name")
    list_filter = ("branch", "teacher", "room", "is_archived")
    autocomplete_fields = ("branch", "room", "teacher")
    readonly_fields = ("colored_box", "text_colored_box")

    form = GroupAdminForm

    @admin.display(description="Color")
    def colored_box(self, obj):
        return format_html(
            '<input type="color" value="{}" disabled style="border:none; width:40px; height:25px;">',
            obj.color,
        )

    @admin.display(description="Text Color")
    def text_colored_box(self, obj):
        return format_html(
            '<input type="color" value="{}" disabled style="border:none; width:40px; height:25px;">',
            obj.text_color,
        )

    @admin.display(description="Current Price")
    def price(self, obj: Group):
        return f"{obj.current_price:0,.2f}"


@admin.register(StudentGroup)
class StudentGroupAdmin(ImportExportModelAdmin):
    list_display = (
        "student",
        "group",
        "joined_at",
        "effective_price_display",
        "has_specific_price",
        "is_archived",
        "archived_at",
    )
    list_filter = ("group__branch", "group__name", "is_archived")
    search_fields = ("student__full_name", "group__name")

    @admin.display(description="Price (UZS)")
    def effective_price_display(self, obj: StudentGroup):
        return f"{obj.effective_price:0,.2f}"

    @admin.display(boolean=True, description="Specific Price")
    def has_specific_price(self, obj):
        return obj.price is not None


@admin.register(Attendance)
class AttendanceAdmin(ImportExportModelAdmin):
    list_display = ("student_group", "date", "is_present", "created_at")
    list_filter = ("is_present", "date", "student_group__group")
    search_fields = ("student_group__student__full_name",)


@admin.register(Holiday)
class HolidayAdmin(ImportExportModelAdmin):
    list_display = ("name", "date", "description")
    list_filter = ("date",)
    search_fields = ("name", "description")
    ordering = ("-date",)


@admin.register(GroupScheduleOverride)
class GroupScheduleOverrideAdmin(ImportExportModelAdmin):
    list_display = (
        "group",
        "original_date",
        "new_date",
        "is_cancelled",
        "is_extra",
        "new_start_time",
        "new_end_time",
    )
    list_filter = ("is_cancelled", "is_extra", "group__branch")
    search_fields = ("group__name", "group__teacher__full_name", "reason")
    ordering = ("-new_date", "-original_date")
