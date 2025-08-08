from datetime import datetime
from django.utils import timezone
from django.db import transaction
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandError
from django.db.models.functions import ExtractMonth, ExtractYear

from core.models import StudentGroup
from finance.models import Transaction


month_names = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr"    
]

def get_billing_day(enrollment, run_date):
    # Returns the billing day (integer) when payment should start
    default_billing_day = 5
    if run_date.month == enrollment.joined_at.month and run_date.year == enrollment.joined_at.year:
        trial_end_day = enrollment.joined_at.day + 4
        return max(default_billing_day, trial_end_day)
    return default_billing_day

class Command(BaseCommand):
    help = "Creates monthly fee (DEBIT) transactions for all active student enrollments."

    def add_arguments(self, parser):
        # Add an optional argument to specify the date for which to run the command
        parser.add_argument(
            '--date',
            type=str,
            help='Run the command for a specific date in YYYY-MM-DD format. Defaults to today.'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        """
        The main logic of the management command.
        """
        # Determine the date to run the command for
        run_date_str = options.get('date')
        if run_date_str:
            try:
                run_date = date.fromisoformat(run_date_str)
                self.stdout.write(self.style.WARNING(f"Running for specified date: {run_date}"))
            except ValueError:
                raise CommandError("Date format is invalid. Please use YYYY-MM-DD.")
        else:
            run_date = timezone.now().date()
            self.stdout.write(f"Running for today's date: {run_date}")

        current_month = month_names[int(run_date.strftime('%m')) - 1]
        
        # --- 1. Find all active student enrollments ---
        # An enrollment is active if the StudentGroup is not archived, the Group is not archived,
        # and the group has not ended yet.
        active_enrollments = StudentGroup.objects.filter(
            is_archived=False,
            group__is_archived=False,
            group__end_date__gte=run_date
        ).select_related('student', 'group')

        self.stdout.write(f"Found {active_enrollments.count()} active student enrollments to check...")
        
        created_count = 0
        skipped_count = 0

        # --- 2. Loop through each active enrollment ---
        for enrollment in active_enrollments:
            student_name = enrollment.student.full_name
            group_name = enrollment.group.name

            if enrollment.joined_at > run_date:
                self.stdout.write(self.style.WARNING(f"⚠️ Skipped {student_name}: joined in future"))
                skipped_count += 1
                continue

            # --- 3. Determine the "billing day" for this month ---
            # It's either the 5th of the month, or 5 days after their join date, whichever is LATER.
            billing_day = get_billing_day(enrollment, run_date)
            
            # --- 4. Check if today is the billing day or later for this student ---
            if run_date.day < billing_day:
                # It's not yet time to bill this student for this month.
                skipped_count += 1
                self.stdout.write(self.style.WARNING(f"Skipped {student_name}: joined at {enrollment.joined_at.strftime('%d.%m.%Y')}"))
                continue

            # --- 5. Check if a monthly fee has ALREADY been created for this month ---
            start_of_this_month = run_date.replace(day=1)
            already_created = Transaction.objects.annotate(
                month=ExtractMonth("created_at"),
                year=ExtractYear("created_at")
            ).filter(
                student_group=enrollment,
                category=Transaction.TransactionCategory.MONTHLY_FEE,
                month=run_date.month,
                year=run_date.year
            ).exists()

            if already_created:
                self.stdout.write(self.style.WARNING(f"Skipped {student_name}: already transaction created"))
                skipped_count += 1
                continue

            # --- 6. If all checks pass, create the DEBIT transaction ---
            effective_price = enrollment.effective_price or 0 # Use the property to get student-specific or group price
            
            # Pro-rate the price if the student joined this month
            if enrollment.joined_at.year == run_date.year and enrollment.joined_at.month == run_date.month and enrollment.joined_at.day != 1:
                days_in_month = (run_date.replace(day=1) + relativedelta(months=1) - timedelta(days=1)).day
                days_attended = days_in_month - enrollment.joined_at.day + 1
                # A simple pro-rating logic
                charge_amount = int(round((effective_price / days_in_month) * days_attended, -3))
                comment = f"{current_month} oyi uchun oylik to'lov. ({days_attended} kun uchun hisoblangan)"
            else:
                charge_amount = effective_price
                comment = f"{current_month} oyi uchun oylik to'lov."
                
            try:
                Transaction.objects.create(
                    student_group=enrollment,
                    transaction_type=Transaction.TransactionType.DEBIT,
                    category=Transaction.TransactionCategory.MONTHLY_FEE,
                    amount=charge_amount,
                    comment=comment,
                    created_at=datetime.combine(run_date, datetime.min.time(), tzinfo=timezone.get_current_timezone())
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + Created DEBIT for {student_name} in {group_name} for {charge_amount} so'm | {comment}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Failed to create for {student_name}: {str(e)}"))
                continue

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully created {created_count} new monthly fee transactions."))
        self.stdout.write(f"Skipped {skipped_count} enrollments (either not yet due or already billed).")
