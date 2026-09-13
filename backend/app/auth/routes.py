from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import User, UserRole
from app.utils.errors import ApiError
from app.auth.decorators import login_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()

    if not email or not password or not name:
        raise ApiError("name, email, and password are required")
    if len(password) < 6:
        raise ApiError("Password must be at least 6 characters")
    if User.query.filter_by(email=email).first():
        raise ApiError("A user with this email already exists", 409)

    user = User(
        email=email,
        name=name,
        role=UserRole.MEMBER,
        password_hash=generate_password_hash(password),
        is_active=True,
        is_approved=False,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Account created. An admin will review and approve your account before you can sign in."}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.is_active or not check_password_hash(user.password_hash, password):
        raise ApiError("Invalid email or password", 401)
    if not user.is_approved:
        raise ApiError("Your account is pending admin approval.", 403)

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
    return jsonify({"access_token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@login_required
def me():
    return jsonify(g.current_user.to_dict())
