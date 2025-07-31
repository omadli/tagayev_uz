from django.core.management.base import BaseCommand
from core.models import Branch, Room
from finance.models import PaymentType


class Command(BaseCommand):
    help = "Create default branch, rooms, payment types"

    def handle(self, *args, **options):
        def_branch, created = Branch.objects.get_or_create(
            name="Asosiy", defaults={"address": "default"}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created default branch: Asosiy"))
        else:
            self.stdout.write(self.style.WARNING(f"Exists branch: Asosiy"))

        self.stdout.write("-" * 20)

        for item in "12":
            obj, created = Room.objects.get_or_create(
                name=item, branch=def_branch, defaults={"capacity": 20}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created room: {item}"))
            else:
                self.stdout.write(self.style.WARNING(f"Exists room: {item}"))

        self.stdout.write("-" * 20)

        default_payment_types = ["Naqd", "Click"]
        for item in default_payment_types:
            obj, created = PaymentType.objects.get_or_create(name=item)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created payment type: {item}"))
            else:
                self.stdout.write(self.style.WARNING(f"Exists payment type: {item}"))
