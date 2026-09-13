from datetime import datetime

from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Delivery, DeliveryStatus, Milestone
from app.auth.decorators import login_required, check_project_access, get_project_or_404
from app.blueprints.milestones import get_milestone_or_404
from app.utils.errors import ApiError

deliveries_bp = Blueprint("deliveries", __name__)


def get_delivery_or_404(delivery_id):
    delivery = Delivery.query.get(delivery_id)
    if not delivery:
        raise ApiError("Delivery not found", 404)
    return delivery


@deliveries_bp.get("/projects/<int:project_id>/deliveries")
@login_required
def list_project_deliveries(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user)
    return jsonify([d.to_dict() for d in project.deliveries])


@deliveries_bp.post("/projects/<int:project_id>/deliveries")
@login_required
def create_project_delivery(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user, write=True)
    return _create_delivery(project_id=project.id, milestone_id=None)


@deliveries_bp.get("/milestones/<int:milestone_id>/deliveries")
@login_required
def list_milestone_deliveries(milestone_id):
    milestone = get_milestone_or_404(milestone_id)
    check_project_access(milestone.project, g.current_user)
    return jsonify([d.to_dict() for d in milestone.deliveries])


@deliveries_bp.post("/milestones/<int:milestone_id>/deliveries")
@login_required
def create_milestone_delivery(milestone_id):
    milestone = get_milestone_or_404(milestone_id)
    check_project_access(milestone.project, g.current_user, write=True)
    return _create_delivery(project_id=milestone.project_id, milestone_id=milestone.id)


def _create_delivery(project_id, milestone_id):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        raise ApiError("title is required")

    delivery = Delivery(
        project_id=project_id,
        milestone_id=milestone_id,
        title=title,
        artifact_url=data.get("artifact_url"),
        description=data.get("description"),
        created_by=g.current_user.id,
    )
    db.session.add(delivery)
    db.session.commit()
    return jsonify(delivery.to_dict()), 201


@deliveries_bp.get("/deliveries/<int:delivery_id>")
@login_required
def get_delivery(delivery_id):
    delivery = get_delivery_or_404(delivery_id)
    check_project_access(delivery.project, g.current_user)
    return jsonify(delivery.to_dict())


@deliveries_bp.patch("/deliveries/<int:delivery_id>")
@login_required
def update_delivery(delivery_id):
    delivery = get_delivery_or_404(delivery_id)
    check_project_access(delivery.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    if "title" in data:
        delivery.title = data["title"]
    if "artifact_url" in data:
        delivery.artifact_url = data["artifact_url"]
    if "description" in data:
        delivery.description = data["description"]
    db.session.commit()
    return jsonify(delivery.to_dict())


@deliveries_bp.patch("/deliveries/<int:delivery_id>/status")
@login_required
def update_delivery_status(delivery_id):
    delivery = get_delivery_or_404(delivery_id)
    check_project_access(delivery.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in [s.value for s in DeliveryStatus]:
        raise ApiError("Invalid status")
    delivery.status = DeliveryStatus(status)

    if delivery.status == DeliveryStatus.DELIVERED:
        delivery.delivered_at = datetime.utcnow()
    elif delivery.status == DeliveryStatus.ACCEPTED:
        delivery.closed_at = datetime.utcnow()
    if "client_response_notes" in data:
        delivery.client_response_notes = data["client_response_notes"]

    db.session.commit()
    return jsonify(delivery.to_dict())


@deliveries_bp.delete("/deliveries/<int:delivery_id>")
@login_required
def delete_delivery(delivery_id):
    delivery = get_delivery_or_404(delivery_id)
    check_project_access(delivery.project, g.current_user, write=True)
    db.session.delete(delivery)
    db.session.commit()
    return jsonify({"success": True})
