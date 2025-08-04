from __future__ import annotations
from django.db import models
from users.models import User
from django.utils import timezone
from django.db.models import Sum, Q
from colorfield.fields import ColorField
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from datetime import date, timedelta

WEEKDAY_DIGIT_VALIDATOR = RegexValidator(
    regex=r"^[1-7]{1,7}$",
    message="Weekdays must be 1-7 digits, no other characters allowed.",
)


class BaseModel(models.Model):
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class Branch(BaseModel):
    name = models.CharField(max_length=100, unique=True, help_text="Name of the branch")
    address = models.TextField(help_text="Physical address of the branch")
    extra_info = models.TextField(
        blank=True, help_text="Optional notes about this branch"
    )

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
        ]
        verbose_name = "Flial"
        verbose_name_plural = "Fliallar"

    def __str__(self):
        return f"{self.name}"


class Room(BaseModel):
    name = models.CharField(max_length=50, help_text="Room name or number")
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, help_text="Branch this room belongs to"
    )
    capacity = models.PositiveIntegerField(help_text="Maximum number of students")
    extra_info = models.TextField(
        blank=True, help_text="Additional information about the room"
    )

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
        ]
        verbose_name = "Xona"
        verbose_name_plural = "Xonalar"

    def __str__(self):
        return f"{self.name} ({self.branch.name})"


class Student(BaseModel):
    full_name = models.CharField(max_length=100, db_index=True)
    phone_number = models.BigIntegerField(
        help_text="Student's phone number", unique=True
    )
    telegram_user_id = models.BigIntegerField(
        null=True, blank=True, help_text="For sending messages via Telegram"
    )
    birth_date = models.DateField(null=True, blank=True)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="students"
    )
    gender = models.CharField(
        max_length=10, choices=[("male", "Male"), ("female", "Female")]
    )
    profile_photo = models.ImageField(
        upload_to="students/photos/",
        blank=True,
        null=True,
        help_text="Optional profile photo of the student",
    )
    comment = models.TextField(blank=True, help_text="Notes about the student")

    class Meta:
        indexes = [
            models.Index(fields=["full_name"]),
            models.Index(fields=["phone_number"]),
        ]
        verbose_name = "O'quvchi"
        verbose_name_plural = "O'quvchilar"

    def __str__(self):
        return f"{self.full_name} - {self.phone_number}"


class Parent(BaseModel):
    full_name = models.CharField(max_length=100)
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="parents"
    )
    phone_number = models.BigIntegerField(help_text="Parent's phone number")
    telegram_user_id = models.BigIntegerField(
        null=True, blank=True, help_text="For Telegram messages"
    )
    gender = models.CharField(
        max_length=10, choices=[("male", "Male"), ("female", "Female")]
    )
    comment = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["full_name"]),
            models.Index(fields=["phone_number"]),
        ]
        verbose_name = "Ota-ona"
        verbose_name_plural = "Ota-onalar"

    def __str__(self):
        return f"{self.full_name} - ({self.student.full_name})"


class Group(BaseModel):
    name = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Group name, e.g., 'Matematika-1' or 'Fizika'",
    )

    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={"is_teacher": True},
        help_text="Assigned teacher",
        related_name="courses",
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        help_text="Branch where the group is taught",
    )

    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Assigned classroom",
    )
    comment = models.TextField(blank=True)

    start_date = models.DateField(help_text="Start date of the course")
    end_date = models.DateField(help_text="End date of the course")

    course_start_time = models.TimeField(
        help_text="Time when the course begins each session"
    )
    course_end_time = models.TimeField(
        help_text="Time when the course ends each session"
    )

    weekdays = models.CharField(
        max_length=7,
        validators=[WEEKDAY_DIGIT_VALIDATOR],
        help_text="Days of the week as digits 1-7 (1=Mon, 7=Sun). E.g., '135' = Mon/Wed/Fri",
    )

    color = ColorField(
        max_length=7,
        help_text="Background color for the group in UI (hex format, e.g., #34D399)",
    )
    text_color = ColorField(
        max_length=7,
        help_text="Text color for UI display (hex format, e.g., #ffffff)",
    )

    @property
    def current_price(self):
        today = timezone.now().date()
        return (
            self.price_history.filter(start_date__lte=today)
            .order_by("-start_date")
            .first()
            .price
        )

    def get_price_on(self, date):
        return (
            self.price_history.filter(start_date__lte=date)
            .order_by("-start_date")
            .first()
            .price
        )

    def regular_lesson_days(self, start_date_range, end_date_range):
        """
        Calculates the regular lesson dates for this group within a given date range.
        :param start_date_range: The beginning of the date range to check (inclusive).
        :param end_date_range: The end of the date range to check (inclusive).
        :return: A sorted list of `datetime.date` objects representing the regular lesson days.
        """

        # Convert group weekdays string '135' to a set of integers {1, 3, 5}
        # Note: Django's weekday() is Monday=0, Sunday=6. ISO weekday is Monday=1, Sunday=7.
        # We will use ISO weekday for clarity.
        scheduled_weekdays = {int(day) for day in self.weekdays}

        # Determine the effective date range for calculation, which is the intersection
        # of the group's lifetime and the requested date range.
        effective_start = max(self.start_date, start_date_range)
        effective_end = min(self.end_date, end_date_range)

        # Use a set for lesson_dates for efficient addition and removal
        lesson_dates = set()

        # Iterate day by day through the effective range
        current_date = effective_start
        while current_date <= effective_end:
            # isoweekday(): Monday is 1 and Sunday is 7
            if current_date.isoweekday() in scheduled_weekdays:
                lesson_dates.add(current_date)
            current_date += timedelta(days=1)

        return sorted(list(lesson_dates))

    def actual_lesson_days(self, start_date_range, end_date_range):
        """
        Calculates the actual lesson dates for this group within a given date range.

        This method accounts for:
        1. The group's regular weekly schedule (weekdays).
        2. The group's overall start and end dates.
        3. Public holidays.
        4. Schedule overrides (cancellations, reschedules, and extra lessons).

        :param start_date_range: The beginning of the date range to check (inclusive).
        :param end_date_range: The end of the date range to check (inclusive).
        :return: A sorted list of `datetime.date` objects representing the actual lesson days.
        """
        effective_start = max(self.start_date, start_date_range)
        effective_end = min(self.end_date, end_date_range)

        # --- Step 1: Generate the base set of potential lesson days ---
        # These are the days that fall on the group's schedule within the requested range.
        lesson_dates: set = set(
            self.regular_lesson_days(start_date_range, end_date_range)
        )
        # --- Step 2: Subtract holidays ---
        # Get all holiday dates within the effective range from the database.
        # .values_list('date', flat=True) is very efficient.
        holidays_in_range = Holiday.objects.filter(
            date__range=(effective_start, effective_end)
        ).values_list("date", flat=True)

        # Remove any lesson date that falls on a holiday
        lesson_dates.difference_update(holidays_in_range)

        # --- Step 3: Apply schedule overrides ---
        # Get all relevant overrides for this group from the database.
        overrides = self.schedule_overrides.filter(
            # Find overrides that affect the calculated lesson dates
            Q(original_date__in=lesson_dates)
            |
            # Or overrides that add a new lesson into our target range
            Q(new_date__range=(start_date_range, end_date_range))
        )

        for override in overrides:
            # If a lesson was cancelled, remove its original date
            if override.is_cancelled and override.original_date in lesson_dates:
                lesson_dates.remove(override.original_date)

            # If a lesson was rescheduled, remove the original and add the new one
            elif not override.is_extra and not override.is_cancelled:
                if override.original_date in lesson_dates:
                    lesson_dates.remove(override.original_date)
                # Only add the new date if it falls within our target range
                if start_date_range <= override.new_date <= end_date_range:
                    lesson_dates.add(override.new_date)

            # If it's an extra lesson, just add the new date
            elif override.is_extra:
                if start_date_range <= override.new_date <= end_date_range:
                    lesson_dates.add(override.new_date)

        # --- Step 4: Return the final, sorted list of dates ---
        return sorted(list(lesson_dates))

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
        ]
        verbose_name = "Guruh"
        verbose_name_plural = "Guruhlar"

    def __str__(self):
        return f"{self.name} | {self.branch.name} - {self.teacher.full_name}"

    def clean(self):
        # Ensure weekdays only contains unique digits from 1 to 7
        if len(set(self.weekdays)) != len(self.weekdays):
            raise ValidationError("Weekdays must not contain duplicate days.")
        if not all(day in "1234567" for day in self.weekdays):
            raise ValidationError("Weekdays must be digits 1-7 only.")


class StudentGroup(BaseModel):
    student = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="group_memberships",
        help_text="Student enrolled in this group",
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="students",
        help_text="Group the student is enrolled in",
    )
    joined_at = models.DateField(help_text="Date when the student joined the group")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Custom price for this student (leave blank to use group price)",
    )

    class Meta:
        unique_together = ("student", "group")
        verbose_name = "Student Group"
        verbose_name_plural = "Student Groups"

    def __str__(self):
        return f"{self.student.full_name} in {self.group.name}"

    @property
    def effective_price(self):
        """
        Return student-specific price if set; else default group current price
        """
        return self.price if self.price is not None else self.group.current_price

    @property
    def balance(self):
        """
        Calculates the real-time balance for this specific student-group enrollment.
        """
        aggregation = self.transactions.aggregate(
            total_debits=Sum("amount", filter=Q(transaction_type="DEBIT"), default=0.0),
            total_credits=Sum(
                "amount", filter=Q(transaction_type="CREDIT"), default=0.0
            ),
        )
        return aggregation["total_credits"] - aggregation["total_debits"]


class Attendance(models.Model):
    student_group = models.ForeignKey(
        "StudentGroup",
        on_delete=models.CASCADE,
        related_name="attendances",
        help_text="Student attendance record",
    )
    date = models.DateField(help_text="Date of the attendance")
    is_present = models.BooleanField(help_text="True if student was present")
    comment = models.TextField(blank=True, help_text="Optional note")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student_group", "date")
        indexes = [
            models.Index(fields=["date"]),
        ]
        verbose_name = "Davomat"
        verbose_name_plural = "Davomatlar"

    def __str__(self):
        return f"{self.student_group.student.full_name} on {self.date} - {'✅' if self.is_present else '❌'}"


class Holiday(models.Model):
    date = models.DateField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bayram"
        verbose_name_plural = "Bayramlar"
        ordering = ["date"]

    def __str__(self):
        return f"{self.name} ({self.date})"


class GroupScheduleOverride(models.Model):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="schedule_overrides",
        help_text="Group this override applies to",
    )

    original_date = models.DateField(
        null=True, blank=True, help_text="Original lesson date (blank if extra lesson)"
    )

    new_date = models.DateField(
        null=True, blank=True, help_text="New date if rescheduled or extra lesson"
    )

    new_start_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Optional start time for rescheduled/extra lesson",
    )

    new_end_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Optional end time for rescheduled/extra lesson",
    )

    is_cancelled = models.BooleanField(default=False)
    is_extra = models.BooleanField(default=False)

    reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Schedule Override"
        verbose_name_plural = "Schedule Overrides"
        indexes = [
            models.Index(fields=["original_date"]),
            models.Index(fields=["new_date"]),
        ]

    def __str__(self):
        if self.is_extra:
            return f"Extra lesson for {self.group.name} on {self.new_date}"
        elif self.is_cancelled:
            return f"Cancelled lesson for {self.group.name} on {self.original_date}"
        else:
            return f"Rescheduled {self.group.name} from {self.original_date} to {self.new_date}"

    def clean(self):
        # Extra lessons
        if self.is_extra:
            if not self.new_date:
                raise ValidationError("Extra lessons must have a new_date.")
            if not self.new_start_time or not self.new_end_time:
                raise ValidationError("Extra lessons must have start and end time.")
            if self.original_date:
                raise ValidationError("Extra lessons must not have an original_date.")

        # Cancellations
        if self.is_cancelled and not self.is_extra:
            if not self.original_date:
                raise ValidationError("Cancelled lessons must have an original_date.")
            if self.new_date or self.new_start_time:
                raise ValidationError(
                    "Cancelled lessons must not have new date or time."
                )

        # Reschedules
        if not self.is_extra and not self.is_cancelled:
            if not self.original_date or not self.new_date:
                raise ValidationError(
                    "Rescheduled lessons must have original_date and new_date."
                )
            if not self.new_start_time or not self.new_end_time:
                raise ValidationError(
                    "Rescheduled lessons must have start and end time."
                )
