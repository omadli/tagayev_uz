# backend/core/serializers.py

from rest_framework import serializers
from .models import (
    Branch,
    Group,
    Student,
    StudentGroup,
    Room,
    Parent,
    Holiday,
    GroupScheduleOverride,
)
from users.models import User
from finance.models import GroupPrice
from dateutil.relativedelta import relativedelta


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "extra_info"]


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for the Room model. Includes a calculated count of active groups.
    """

    active_groups_count = serializers.IntegerField(read_only=True)
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_archived=False)
    )

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "branch",
            "capacity",
            "extra_info",
            "is_archived",
            "active_groups_count",
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """
    A read-only serializer to aggregate various statistics for the dashboard.
    This serializer does not map directly to a single model.
    """

    active_leads = serializers.IntegerField()
    groups = serializers.IntegerField()
    remaining_debts = serializers.IntegerField()
    debtors = serializers.IntegerField()
    payment_due_soon = serializers.IntegerField()
    active_students = serializers.IntegerField()
    attrition_students = serializers.IntegerField()  # "Kelib ketganlar"
    teachers = serializers.IntegerField()
    admins = serializers.IntegerField()


class StudentGroupInfoSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="group.name", read_only=True)
    teacher = serializers.CharField(source="group.teacher.full_name", read_only=True)

    class Meta:
        model = StudentGroup
        fields = ["name", "teacher"]


# The main serializer for the Students page
class StudentSerializer(serializers.ModelSerializer):
    # --- Read-only fields for displaying data ---
    groups = StudentGroupInfoSerializer(
        source="group_memberships", many=True, read_only=True
    )
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    # This field will show the branch name in the API response
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    # --- Writable field for creating/updating ---
    # This field will accept a branch ID when creating/updating a student
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_archived=False),
        write_only=True,  # This field is ONLY for input
    )

    class Meta:
        model = Student
        fields = [
            "id",
            "full_name",
            "phone_number",
            "profile_photo",
            "gender",
            "birth_date",
            "comment",
            "is_archived",
            # Add the new fields
            "branch",  # For writing
            "branch_name",  # For reading
            "groups",
            "balance",
        ]
        # --- REMOVED: The conflicting 'depth' and 'extra_kwargs' are gone ---

    def create(self, validated_data):
        # The default create logic is now sufficient
        return super().create(validated_data)


class StudentUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for updating a Student's core information.
    """

    class Meta:
        model = Student
        fields = [
            "full_name",
            "phone_number",
            "profile_photo",
            "birth_date",
            "gender",
            "comment",
        ]

        # All fields are optional for an update (PATCH) request
        extra_kwargs = {
            "full_name": {"required": False},
            "phone_number": {"required": False},
        }


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer for the Group model that handles nested creation of GroupPrice.
    """

    # --- Read-only fields for displaying names and current price ---
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    room_name = serializers.CharField(
        source="room.name", read_only=True, allow_null=True
    )
    # This uses the @property on your model to get the current price for display
    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    students_count = serializers.IntegerField(read_only=True)

    # --- Writable fields for creating/updating ---
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_teacher=True, is_active=True)
    )
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_archived=False)
    )
    room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.filter(is_archived=False), required=False, allow_null=True
    )
    is_archived = serializers.BooleanField(read_only=True)
    # --- THIS IS THE NEW PRICE FIELD ---
    # This field is not on the Group model, so we declare it explicitly.
    # It's write-only because we don't send it back; we send 'current_price' instead.
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        write_only=True,
        required=True,  # Make it required for creation
        help_text="The initial price for this group.",
    )

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "course_start_time",
            "course_end_time",
            "weekdays",
            "comment",
            "is_archived",
            "color",
            "text_color",  # Add color fields
            # Writable related fields
            "teacher",
            "branch",
            "room",
            "price",  # Add price field
            # Read-only display fields
            "is_archived",
            "teacher_name",
            "branch_name",
            "room_name",
            "current_price",
            "students_count",
        ]

    def validate(self, data):
        """
        Custom validation for dates and times.
        """
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        start_time = data.get("course_start_time")
        end_time = data.get("course_end_time")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                {
                    "end_date": "Kursning tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas."
                }
            )

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {
                    "course_end_time": "Darsning tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak."
                }
            )

        return data

    def create(self, validated_data):
        """
        This method now handles the creation of both the Group and its initial GroupPrice.
        """
        # 1. Pop the 'price' data because it's not a field on the Group model itself.
        price_amount = validated_data.pop("price")

        # 2. Create the Group instance with the remaining validated data.
        group = Group.objects.create(**validated_data)

        # 3. Create the associated GroupPrice object.
        #    The price's start_date will be the same as the group's start_date.
        GroupPrice.objects.create(
            group=group, price=price_amount, start_date=validated_data["start_date"]
        )

        return group

    def update(self, instance, validated_data):
        """
        This method handles updates. It does not create a new GroupPrice.
        Updating prices should be a separate, explicit action.
        """
        # Pop the 'price' field if it was sent, as we don't update price here.
        validated_data.pop("price", None)

        # Use the default update method for all other fields.
        return super().update(instance, validated_data)

    def validate_weekdays(self, value):
        """
        Ensures weekdays only contains unique digits from 1 to 7.
        """
        if not value.isdigit() or not all(day in "1234567" for day in value):
            raise serializers.ValidationError(
                "Hafta kunlari faqat 1-7 oralig'idagi raqamlar bo'lishi kerak."
            )
        if len(set(value)) != len(value):
            raise serializers.ValidationError("Hafta kunlari takrorlanmasligi kerak.")
        return value


class ParentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = ["full_name", "phone_number", "gender", "comment"]


class StudentGroupCreateSerializer(serializers.ModelSerializer):
    # The frontend will send the ID of the group
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.filter(is_archived=False)
    )

    class Meta:
        model = StudentGroup
        fields = ["group", "joined_at", "price"]


class StudentGroupEnrollSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for creating (enrolling) a new StudentGroup record.
    """
    class Meta:
        model = StudentGroup
        fields = [
            "id",
            "student",
            "group",
            "joined_at",
            "price",  # This can be null
        ]

    def validate(self, data):
        """
        Check that the student is not already in the group.
        The model's `unique_together` also handles this, but this provides a cleaner error.
        """
        student = data.get("student")
        group = data.get("group")

        if StudentGroup.objects.filter(student=student, group=group).exists():
            raise serializers.ValidationError(
                {"student": f"{student.full_name} allaqachon bu guruhga a'zo."}
            )
        return data


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer to list a student's active group enrollments,
    including the real-time balance for each.
    """

    group_name = serializers.CharField(source="group.name", read_only=True)
    teacher_name = serializers.CharField(
        source="group.teacher.full_name", read_only=True
    )
    # The 'balance' property from the model is automatically included
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    # Include the effective price for this enrollment
    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    next_due_date = serializers.SerializerMethodField()
    next_due_amount = serializers.SerializerMethodField()

    class Meta:
        model = StudentGroup
        fields = [
            "id",
            "group_name",
            "teacher_name",
            "balance",
            "effective_price",
            "next_due_date",
            "next_due_amount",
        ]

    def get_next_due_date(self, obj: StudentGroup):
        """
        Calculates the next payment date for this enrollment.
        Logic: It's one month after the student's join date, or one month after their
        last monthly fee debit, whichever is later.
        """
        last_debit = (
            obj.transactions.filter(category="MONTHLY_FEE")
            .order_by("-created_at")
            .first()
        )

        base_date = obj.joined_at
        if last_debit:
            base_date = last_debit.created_at.date()

        # Calculate the next due date by adding one month
        next_date = base_date + relativedelta(months=1)

        # Ensure the due date is not after the group ends
        if next_date > obj.group.end_date:
            return None

        return next_date

    def get_next_due_amount(self, obj: StudentGroup):
        """
        Calculates the amount due for the next payment period.
        This can be a full month's price or pro-rated.
        For simplicity here, we'll return the full effective price.
        A more complex pro-rating logic could be added if needed.
        """
        return obj.effective_price


class StudentCreateSerializer(serializers.ModelSerializer):
    # These fields accept a list of objects from the frontend
    parents = ParentCreateSerializer(many=True, required=False)
    groups = StudentGroupCreateSerializer(many=True, required=False)

    # We will get the branch from the request context, not the body
    branch = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Student
        fields = [
            "profile_photo",
            "full_name",
            "phone_number",
            "birth_date",
            "gender",
            "comment",
            "branch",
            "parents",
            "groups",
        ]

    def create(self, validated_data):
        # 1. Pop the nested data before we create the student
        parents_data = validated_data.pop("parents", [])
        groups_data = validated_data.pop("groups", [])

        # 2. Get the branch from the context (we'll set this in the view)
        branch = self.context["branch"]
        validated_data["branch"] = branch

        # 3. Create the Student object
        student = Student.objects.create(**validated_data)

        # 4. Create the nested Parent objects and link them to the student
        for parent_data in parents_data:
            Parent.objects.create(student=student, **parent_data)

        # 5. Create the nested StudentGroup objects and link them to the student
        for group_data in groups_data:
            StudentGroup.objects.create(student=student, **group_data)

        return student


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"


class GroupScheduleOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupScheduleOverride
        fields = "__all__"

class GroupPriceSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupPrice
        fields = ['price', 'start_date']

class StudentInGroupSerializer(serializers.ModelSerializer):
    """Serializer for students listed within a group detail view."""
    id = serializers.IntegerField(source='student.id', read_only=True)
    full_name = serializers.CharField(source='student.full_name', read_only=True)
    phone_number = serializers.CharField(source='student.phone_number', read_only=True)
    profile_photo = serializers.ImageField(source='student.profile_photo', read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = StudentGroup
        fields = [
            # Fields from the Student model
            'id', 'full_name', 'phone_number', 'profile_photo',
            
            # Fields from the StudentGroup model itself
            'joined_at',
            'price', # The specific price for this student in this group
            'balance',
        ]

class GroupDetailSerializer(serializers.ModelSerializer):
    """
    A comprehensive serializer for the single group detail page.
    """
    teacher_id = serializers.IntegerField(source='teacher.id', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True, allow_null=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    # Nested list of all students in the group
    students_list = StudentInGroupSerializer(source='students', many=True, read_only=True)
    
    # Nested list of all price changes for the group
    price_history = GroupPriceSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'start_date', 'end_date', 'course_start_time',
            'course_end_time', 'weekdays', 'comment', 'color', 'text_color',
            'teacher_id', 'teacher_name', 'branch_name', 'room_name', 'current_price',
            'students_list', 'price_history', 'is_archived', 'archived_at'
        ]


class StudentGroupListSerializer(serializers.ModelSerializer):
    """
    A comprehensive serializer for listing StudentGroup enrollments.
    This is the single source of truth for the "O'quvchilar" tab in the Group Detail page.
    """
    # --- Nested data from the Student model ---
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    student_full_name = serializers.CharField(source='student.full_name', read_only=True)
    student_phone_number = serializers.CharField(source='student.phone_number', read_only=True)
    student_profile_photo = serializers.ImageField(source='student.profile_photo', read_only=True)
    
    # --- Calculated balance field ---
    current_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = StudentGroup
        fields = [
            'id', # The ID of the StudentGroup enrollment itself
            'student_id',
            'student_full_name',
            'student_phone_number',
            'student_profile_photo',
            'joined_at',
            'price',
            'current_balance',
            'is_archived',
            'archived_at',
        ]