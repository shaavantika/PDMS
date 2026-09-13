from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import User, UserRole
from app.auth.decorators import role_required
from app.utils.errors import ApiError

users_bp = Blueprint("users", __name__)


@users_bp.get("")
@role_required(UserRole.ADMIN, UserRole.PM)
def list_users():
    users = User.query.filter_by(is_approved=True).order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.get("/pending")
@role_required(UserRole.ADMIN)
def list_pending_users():
    users = User.query.filter_by(is_approved=False).order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.post("/<int:user_id>/approve")
@role_required(UserRole.ADMIN)
def approve_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise ApiError("User not found", 404)
    user.is_approved = True
    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.post("/<int:user_id>/reject")
@role_required(UserRole.ADMIN)
def reject_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise ApiError("User not found", 404)
    if user.is_approved:
        raise ApiError("This user is already approved — deactivate instead of rejecting")
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})


@users_bp.post("")
@role_required(UserRole.ADMIN)
def create_user():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()
    role = data.get("role", UserRole.MEMBER.value)

    if not email or not password or not name:
        raise ApiError("email, password, and name are required")
    if role not in [r.value for r in UserRole]:
        raise ApiError("Invalid role")
    if User.query.filter_by(email=email).first():
        raise ApiError("A user with this email already exists", 409)

    user = User(
        email=email,
        name=name,
        role=UserRole(role),
        password_hash=generate_password_hash(password),
        is_approved=True,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@users_bp.patch("/<int:user_id>")
@role_required(UserRole.ADMIN)
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise ApiError("User not found", 404)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        user.name = data["name"]
    if "role" in data:
        if data["role"] not in [r.value for r in UserRole]:
            raise ApiError("Invalid role")
        user.role = UserRole(data["role"])
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "password" in data and data["password"]:
        user.password_hash = generate_password_hash(data["password"])

    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.delete("/<int:user_id>")
@role_required(UserRole.ADMIN)
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise ApiError("User not found", 404)
    user.is_active = False
    db.session.commit()
    return jsonify({"success": True})
