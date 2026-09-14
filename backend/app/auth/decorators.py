from functools import wraps

from flask import g
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.models import User, UserRole, Project, ResourcePage, GroupPermission
from app.utils.errors import ApiError


def load_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        raise ApiError("Unauthorized", 401)
    g.current_user = user
    return user


def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in [r.value for r in roles]:
                raise ApiError("Forbidden", 403)
            load_current_user()
            return fn(*args, **kwargs)

        return decorated

    return wrapper


def login_required(fn):
    @wraps(fn)
    @jwt_required()
    def decorated(*args, **kwargs):
        load_current_user()
        return fn(*args, **kwargs)

    return decorated


def check_project_access(project: Project, user: User, write=False):
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.PM:
        if project.owner_id == user.id:
            return
        if not write and user in project.members:
            return
        raise ApiError("Forbidden", 403)
    if user.role == UserRole.MEMBER:
        if write:
            raise ApiError("Forbidden", 403)
        if user in project.members:
            return
        raise ApiError("Forbidden", 403)
    raise ApiError("Forbidden", 403)


def get_project_or_404(project_id):
    project = Project.query.get(project_id)
    if not project:
        raise ApiError("Project not found", 404)
    return project


def has_page_access(user: User, page: ResourcePage, write=False) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if not user.group_id:
        return False
    perm = GroupPermission.query.filter_by(group_id=user.group_id, page=page).first()
    if not perm:
        return False
    return perm.can_write if write else perm.can_read


def require_page_access(user: User, page: ResourcePage, write=False):
    if not has_page_access(user, page, write=write):
        raise ApiError("Forbidden", 403)
