from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Project, ProjectStatus, User, UserRole
from app.auth.decorators import login_required, role_required, check_project_access, get_project_or_404
from app.utils.errors import ApiError

projects_bp = Blueprint("projects", __name__)


@projects_bp.get("")
@login_required
def list_projects():
    user = g.current_user
    if user.role == UserRole.ADMIN:
        projects = Project.query.order_by(Project.created_at.desc()).all()
    elif user.role == UserRole.PM:
        owned = set(user.projects_owned)
        member_of = set(user.projects_member_of)
        projects = sorted(owned | member_of, key=lambda p: p.created_at, reverse=True)
    else:
        projects = sorted(user.projects_member_of, key=lambda p: p.created_at, reverse=True)
    return jsonify([p.to_dict(include_counts=True) for p in projects])


@projects_bp.post("")
@role_required(UserRole.ADMIN, UserRole.PM)
def create_project():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        raise ApiError("name is required")

    project = Project(
        name=name,
        description=data.get("description"),
        client_name=data.get("client_name"),
        owner_id=g.current_user.id,
        status=ProjectStatus(data.get("status", ProjectStatus.ACTIVE.value)),
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict(include_counts=True)), 201


@projects_bp.get("/<int:project_id>")
@login_required
def get_project(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user)
    return jsonify(project.to_dict(include_counts=True))


@projects_bp.patch("/<int:project_id>")
@login_required
def update_project(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        project.name = data["name"]
    if "description" in data:
        project.description = data["description"]
    if "client_name" in data:
        project.client_name = data["client_name"]
    if "status" in data:
        if data["status"] not in [s.value for s in ProjectStatus]:
            raise ApiError("Invalid status")
        project.status = ProjectStatus(data["status"])

    db.session.commit()
    return jsonify(project.to_dict(include_counts=True))


@projects_bp.delete("/<int:project_id>")
@role_required(UserRole.ADMIN)
def delete_project(project_id):
    project = get_project_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"success": True})


@projects_bp.post("/<int:project_id>/members")
@login_required
def add_member(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    user = User.query.get(data.get("user_id"))
    if not user:
        raise ApiError("User not found", 404)
    if user not in project.members:
        project.members.append(user)
        db.session.commit()
    return jsonify(project.to_dict(include_counts=True))


@projects_bp.delete("/<int:project_id>/members/<int:user_id>")
@login_required
def remove_member(project_id, user_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user, write=True)

    user = User.query.get(user_id)
    if user and user in project.members:
        project.members.remove(user)
        db.session.commit()
    return jsonify(project.to_dict(include_counts=True))
