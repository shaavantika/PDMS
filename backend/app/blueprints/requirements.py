from datetime import datetime

from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Requirement, RequirementStatus, RequirementPriority, Stakeholder, UserRole
from app.auth.decorators import login_required, check_project_access, get_project_or_404
from app.blueprints.modules import get_module_or_404
from app.utils.errors import ApiError

requirements_bp = Blueprint("requirements", __name__)


def get_requirement_or_404(requirement_id):
    requirement = Requirement.query.get(requirement_id)
    if not requirement:
        raise ApiError("Requirement not found", 404)
    return requirement


@requirements_bp.get("/modules/<int:module_id>/requirements")
@login_required
def list_requirements(module_id):
    module = get_module_or_404(module_id)
    check_project_access(module.project, g.current_user)
    return jsonify([r.to_dict() for r in module.requirements])


@requirements_bp.post("/modules/<int:module_id>/requirements")
@login_required
def create_requirement(module_id):
    module = get_module_or_404(module_id)
    check_project_access(module.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        raise ApiError("title is required")

    stakeholder_id = data.get("stakeholder_id")
    if stakeholder_id:
        stakeholder = Stakeholder.query.get(stakeholder_id)
        if not stakeholder or stakeholder.project_id != module.project_id:
            raise ApiError("Invalid stakeholder_id")

    priority = data.get("priority", RequirementPriority.MEDIUM.value)
    if priority not in [p.value for p in RequirementPriority]:
        raise ApiError("Invalid priority")

    requirement = Requirement(
        project_id=module.project_id,
        module_id=module.id,
        title=title,
        description=data.get("description"),
        stakeholder_id=stakeholder_id,
        priority=RequirementPriority(priority),
        status=RequirementStatus.DRAFT,
        created_by=g.current_user.id,
    )
    db.session.add(requirement)
    db.session.commit()
    return jsonify(requirement.to_dict()), 201


@requirements_bp.get("/requirements/<int:requirement_id>")
@login_required
def get_requirement(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    check_project_access(requirement.project, g.current_user)
    return jsonify(requirement.to_dict())


@requirements_bp.patch("/requirements/<int:requirement_id>")
@login_required
def update_requirement(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    check_project_access(requirement.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    if "title" in data:
        requirement.title = data["title"]
    if "description" in data:
        requirement.description = data["description"]
    if "priority" in data:
        if data["priority"] not in [p.value for p in RequirementPriority]:
            raise ApiError("Invalid priority")
        requirement.priority = RequirementPriority(data["priority"])
    if "stakeholder_id" in data:
        requirement.stakeholder_id = data["stakeholder_id"]
    if "status" in data and data["status"] == RequirementStatus.PENDING_APPROVAL.value:
        requirement.status = RequirementStatus.PENDING_APPROVAL

    db.session.commit()
    return jsonify(requirement.to_dict())


@requirements_bp.delete("/requirements/<int:requirement_id>")
@login_required
def delete_requirement(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    check_project_access(requirement.project, g.current_user, write=True)
    db.session.delete(requirement)
    db.session.commit()
    return jsonify({"success": True})


@requirements_bp.post("/requirements/<int:requirement_id>/approve")
@login_required
def approve_requirement(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    if g.current_user.role not in (UserRole.ADMIN, UserRole.PM):
        raise ApiError("Forbidden", 403)
    check_project_access(requirement.project, g.current_user, write=True)

    requirement.status = RequirementStatus.APPROVED
    requirement.approved_by = g.current_user.id
    requirement.approved_at = datetime.utcnow()
    db.session.commit()
    return jsonify(requirement.to_dict())


@requirements_bp.post("/requirements/<int:requirement_id>/reject")
@login_required
def reject_requirement(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    if g.current_user.role not in (UserRole.ADMIN, UserRole.PM):
        raise ApiError("Forbidden", 403)
    check_project_access(requirement.project, g.current_user, write=True)

    requirement.status = RequirementStatus.REJECTED
    requirement.approved_by = g.current_user.id
    requirement.approved_at = datetime.utcnow()
    db.session.commit()
    return jsonify(requirement.to_dict())


@requirements_bp.get("/projects/<int:project_id>/requirements/pending")
@login_required
def pending_requirements(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user)

    pending = [r for r in project.requirements if r.status == RequirementStatus.PENDING_APPROVAL]
    return jsonify([r.to_dict() for r in pending])
