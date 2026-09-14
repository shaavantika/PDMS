from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import UserGroup, GroupPermission, ResourcePage, User, UserRole
from app.auth.decorators import role_required
from app.utils.errors import ApiError

groups_bp = Blueprint("groups", __name__)


def _validate_permissions_payload(payload):
    if payload is None:
        return []
    if not isinstance(payload, list):
        raise ApiError("permissions must be a list")
    valid_pages = {p.value for p in ResourcePage}
    seen = set()
    cleaned = []
    for entry in payload:
        page = entry.get("page")
        if page not in valid_pages:
            raise ApiError(f"Invalid page: {page}")
        if page in seen:
            raise ApiError(f"Duplicate page in permissions: {page}")
        seen.add(page)
        can_read = bool(entry.get("can_read", False))
        can_write = bool(entry.get("can_write", False))
        cleaned.append({"page": ResourcePage(page), "can_read": can_read, "can_write": can_write})
    return cleaned


def get_group_or_404(group_id):
    group = UserGroup.query.get(group_id)
    if not group:
        raise ApiError("Group not found", 404)
    return group


@groups_bp.get("")
@role_required(UserRole.ADMIN)
def list_groups():
    groups = UserGroup.query.order_by(UserGroup.name).all()
    return jsonify([g.to_dict() for g in groups])


@groups_bp.post("")
@role_required(UserRole.ADMIN)
def create_group():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        raise ApiError("name is required")
    if UserGroup.query.filter_by(name=name).first():
        raise ApiError("A group with this name already exists", 409)

    permissions = _validate_permissions_payload(data.get("permissions"))

    group = UserGroup(name=name, description=data.get("description"))
    db.session.add(group)
    db.session.flush()
    for perm in permissions:
        db.session.add(GroupPermission(group_id=group.id, **perm))
    db.session.commit()
    return jsonify(group.to_dict()), 201


@groups_bp.get("/<int:group_id>")
@role_required(UserRole.ADMIN)
def get_group(group_id):
    group = get_group_or_404(group_id)
    return jsonify(group.to_dict())


@groups_bp.patch("/<int:group_id>")
@role_required(UserRole.ADMIN)
def update_group(group_id):
    group = get_group_or_404(group_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            raise ApiError("name is required")
        existing = UserGroup.query.filter_by(name=name).first()
        if existing and existing.id != group.id:
            raise ApiError("A group with this name already exists", 409)
        group.name = name
    if "description" in data:
        group.description = data["description"]
    if "permissions" in data:
        permissions = _validate_permissions_payload(data["permissions"])
        GroupPermission.query.filter_by(group_id=group.id).delete()
        for perm in permissions:
            db.session.add(GroupPermission(group_id=group.id, **perm))

    db.session.commit()
    return jsonify(group.to_dict())


@groups_bp.delete("/<int:group_id>")
@role_required(UserRole.ADMIN)
def delete_group(group_id):
    group = get_group_or_404(group_id)
    if User.query.filter_by(group_id=group.id).first():
        raise ApiError("Group has assigned users", 409)
    db.session.delete(group)
    db.session.commit()
    return jsonify({"success": True})
