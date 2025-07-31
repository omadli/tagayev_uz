from rest_framework import permissions


class IsCeoOrSuperuserOrSelf(permissions.BasePermission):
    """
    Allows access only to CEOs, superusers, or the user themselves.
    """

    def has_permission(self, request, view):
        # This check is for list/create views (no object yet)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the user themselves,
        # or to a CEO/Superuser.
        return request.user.is_ceo or request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the user themselves,
        # or to a CEO/Superuser.
        return obj == request.user or request.user.is_ceo or request.user.is_superuser


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to CEOs, superusers.
    """

    def has_permission(self, request, view):
        # This check is for list/create views (no object yet)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_ceo
                or request.user.is_admin
                or request.user.is_superuser
            )
        )

    def has_object_permission(self, request, view, obj):
        # This permission are only allowed to a CEO/Superuser.
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_ceo
                or request.user.is_admin
                or request.user.is_superuser
            )
        )


class IsAuthenticatedOrAdminForUnsafe(permissions.BasePermission):
    """
    Allows access only to CEOs, superusers for deleting.
    """

    def has_permission(self, request, view):
        # This check is for list/create views (no object yet)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_ceo
                or request.user.is_admin
                or request.user.is_superuser
            )
        )

    def has_object_permission(self, request, view, obj):
        # This check is for detail views (retrieve, update, delete and other actions)
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions are only allowed to a CEO/Superuser.
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_ceo
                or request.user.is_superuser
                or request.user.is_admin
            )
        )


class IsCeoForUnsafe(permissions.BasePermission):
    """
    Allows access only to CEOs, superusers for deleting.
    """

    def has_permission(self, request, view):
        # This check is for list/create views (no object yet)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_ceo or request.user.is_superuser)
        )

    def has_object_permission(self, request, view, obj):
        # This check is for detail views (retrieve, update, delete and other actions)
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions are only allowed to a CEO/Superuser.
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_ceo or request.user.is_superuser)
        )
