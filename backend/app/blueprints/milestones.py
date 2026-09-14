from datetime import datetime

from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Milestone, MilestoneStatus, ResourcePage
from app.auth.decorators import login_required, check_project_access, get_project_or_404, require_page_access
from app.utils.errors import ApiError

milestones_bp = Blueprint("milestones", __name__)


def get_milestone_or_404(milestone_id):
    milestone = Milestone.query.get(milestone_id)
    if not milestone:
        raise ApiError("Milestone not found", 404)
    return milestone


def parse_due_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ApiError("due_date must be YYYY-MM-DD")


@milestones_bp.get("/projects/<int:project_id>/milestones")
@login_required
def list_milestones(project_id):
    project = get_project_or_404(project_id)
    require_page_access(g.current_user, ResourcePage.MILESTONES, write=False)
    check_project_access(project, g.current_user)
    return jsonify([m.to_dict() for m in project.milestones])


@milestones_bp.post("/projects/<int:project_id>/milestones")
@login_required
def create_milestone(project_id):
    project = get_project_or_404(project_id)
    require_page_access(g.current_user, ResourcePage.MILESTONES, write=True)
    check_project_access(project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        raise ApiError("name is required")

    milestone = Milestone(
        project_id=project.id,
        name=name,
        description=data.get("description"),
        due_date=parse_due_date(data.get("due_date")),
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201


@milestones_bp.get("/milestones/<int:milestone_id>")
@login_required
def get_milestone(milestone_id):
    milestone = get_milestone_or_404(milestone_id)
    require_page_access(g.current_user, ResourcePage.MILESTONES, write=False)
    check_project_access(milestone.project, g.current_user)
    return jsonify(milestone.to_dict())


@milestones_bp.patch("/milestones/<int:milestone_id>")
@login_required
def update_milestone(milestone_id):
    milestone = get_milestone_or_404(milestone_id)
    require_page_access(g.current_user, ResourcePage.MILESTONES, write=True)
    check_project_access(milestone.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        milestone.name = data["name"]
    if "description" in data:
        milestone.description = data["description"]
    if "due_date" in data:
        milestone.due_date = parse_due_date(data["due_date"])
    db.session.commit()
    return jsonify(milestone.to_dict())


@milestones_bp.delete("/milestones/<int:milestone_id>")
@login_required
def delete_milestone(milestone_id):
    milestone = get_milestone_or_404(milestone_id)
    require_page_access(g.current_user, ResourcePage.MILESTONES, write=True)
    check_project_access(milestone.project, g.current_user, write=True)
    db.session.delete(milestone)
    db.session.commit()
    return jsonify({"success": True})


@milestones_bp.patch("/milestones/<int:milestone_id>/status")
@login_required
def override_milestone_status(milestone_id):
    milestone = get_milestone_or_404(milestone_id)
    require_page_access(g.current_user, ResourcePage.MILESTONES, write=True)
    check_project_access(milestone.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in [s.value for s in MilestoneStatus]:
        raise ApiError("Invalid status")
    milestone.status = MilestoneStatus(status)
    milestone.status_override = True
    db.session.commit()
    return jsonify(milestone.to_dict())
