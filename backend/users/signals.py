from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from user_agents import parse
from .models import LoginLog


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    user_agent_str = request.META.get("HTTP_USER_AGENT", "")
    user_agent = parse(user_agent_str)

    LoginLog.objects.create(
        user=user,
        ip_address=get_client_ip(request),
        user_agent=user_agent_str,
        device=f"{user_agent.device.brand or ''} {user_agent.device.family or ''}".strip(),
        browser=f"{user_agent.browser.family} {user_agent.browser.version_string}",
        os=f"{user_agent.os.family} {user_agent.os.version_string}",
    )


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
