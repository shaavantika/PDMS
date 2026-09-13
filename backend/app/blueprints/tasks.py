from datetime import datetime

from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Task, TaskStatus, User, UserRole, Milestone
from app.auth.decorators import login_required, check_project_access, get_project_or_404
from app.blueprints.requirements import get_requirement_or_404
from app.utils.errors import ApiError

tasks_bp = Blueprint("tasks", __name__)


def get_task_or_404(task_id):
    task = Task.query.get(task_id)
    if not task:
        raise ApiError("Task not found", 404)
    return task


def parse_due_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ApiError("due_date must be YYYY-MM-DD")


@tasks_bp.get("/requirements/<int:requirement_id>/tasks")
@login_required
def list_requirement_tasks(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    check_project_access(requirement.project, g.current_user)
    return jsonify([t.to_dict() for t in requirement.tasks])


@tasks_bp.post("/requirements/<int:requirement_id>/tasks")
@login_required
def create_requirement_task(requirement_id):
    requirement = get_requirement_or_404(requirement_id)
    check_project_access(requirement.project, g.current_user, write=True)
    return _create_task(project_id=requirement.project_id, requirement_id=requirement.id)


@tasks_bp.get("/projects/<int:project_id>/tasks")
@login_required
def list_project_tasks(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user)
    return jsonify([t.to_dict() for t in project.tasks])


@tasks_bp.post("/projects/<int:project_id>/tasks")
@login_required
def create_project_task(project_id):
    project = get_project_or_404(project_id)
    check_project_access(project, g.current_user, write=True)
    return _create_task(project_id=project.id, requirement_id=None)


def _create_task(project_id, requirement_id):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        raise ApiError("title is required")

    assignee_id = data.get("assignee_id")
    if assignee_id and not User.query.get(assignee_id):
        raise ApiError("Invalid assignee_id")

    milestone_id = data.get("milestone_id")
    if milestone_id:
        milestone = Milestone.query.get(milestone_id)
        if not milestone or milestone.project_id != project_id:
            raise ApiError("Invalid milestone_id")

    task = Task(
        project_id=project_id,
        requirement_id=requirement_id,
        title=title,
        description=data.get("description"),
        assignee_id=assignee_id,
        milestone_id=milestone_id,
        due_date=parse_due_date(data.get("due_date")),
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.get("/tasks")
@login_required
def list_my_tasks():
    user = g.current_user
    tasks = Task.query.order_by(Task.created_at.desc()).all()
    tasks = [t for t in tasks if _has_read_access(t.project, user)]
    if request.args.get("assignee") == "me":
        tasks = [t for t in tasks if t.assignee_id == user.id]
    return jsonify([t.to_dict() for t in tasks])


def _has_read_access(project, user):
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.PM:
        return project.owner_id == user.id or user in project.members
    return user in project.members


@tasks_bp.get("/tasks/<int:task_id>")
@login_required
def get_task(task_id):
    task = get_task_or_404(task_id)
    check_project_access(task.project, g.current_user)
    return jsonify(task.to_dict())


@tasks_bp.patch("/tasks/<int:task_id>")
@login_required
def update_task(task_id):
    task = get_task_or_404(task_id)
    check_project_access(task.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    if "title" in data:
        task.title = data["title"]
    if "description" in data:
        task.description = data["description"]
    if "assignee_id" in data:
        task.assignee_id = data["assignee_id"]
    if "milestone_id" in data:
        task.milestone_id = data["milestone_id"]
    if "due_date" in data:
        task.due_date = parse_due_date(data["due_date"])

    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.delete("/tasks/<int:task_id>")
@login_required
def delete_task(task_id):
    task = get_task_or_404(task_id)
    check_project_access(task.project, g.current_user, write=True)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"success": True})


@tasks_bp.patch("/tasks/<int:task_id>/status")
@login_required
def update_task_status(task_id):
    task = get_task_or_404(task_id)
    user = g.current_user

    if user.role == UserRole.MEMBER:
        if task.assignee_id != user.id:
            raise ApiError("Forbidden", 403)
    else:
        check_project_access(task.project, user, write=True)

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in [s.value for s in TaskStatus]:
        raise ApiError("Invalid status")
    task.status = TaskStatus(status)
    if "progress_pct" in data:
        task.progress_pct = max(0, min(100, int(data["progress_pct"])))
    elif task.status == TaskStatus.DONE:
        task.progress_pct = 100

    db.session.commit()
    return jsonify(task.to_dict())
