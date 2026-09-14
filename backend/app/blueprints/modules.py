from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Module, UserRole, ResourcePage
from app.auth.decorators import login_required, check_project_access, get_project_or_404, require_page_access
from app.utils.errors import ApiError

modules_bp = Blueprint("modules", __name__)


def get_module_or_404(module_id):
    module = Module.query.get(module_id)
    if not module:
        raise ApiError("Module not found", 404)
    return module


@modules_bp.get("/projects/<int:project_id>/modules")
@login_required
def list_modules(project_id):
    project = get_project_or_404(project_id)
    require_page_access(g.current_user, ResourcePage.MODULES, write=False)
    check_project_access(project, g.current_user)
    return jsonify([m.to_dict(include_counts=True) for m in project.modules])


@modules_bp.post("/projects/<int:project_id>/modules")
@login_required
def create_module(project_id):
    project = get_project_or_404(project_id)
    require_page_access(g.current_user, ResourcePage.MODULES, write=True)
    check_project_access(project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        raise ApiError("name is required")

    module = Module(project_id=project.id, name=name, description=data.get("description"))
    db.session.add(module)
    db.session.commit()
    return jsonify(module.to_dict(include_counts=True)), 201


@modules_bp.get("/modules/<int:module_id>")
@login_required
def get_module(module_id):
    module = get_module_or_404(module_id)
    require_page_access(g.current_user, ResourcePage.MODULES, write=False)
    check_project_access(module.project, g.current_user)
    return jsonify(module.to_dict(include_counts=True))


@modules_bp.patch("/modules/<int:module_id>")
@login_required
def update_module(module_id):
    module = get_module_or_404(module_id)
    require_page_access(g.current_user, ResourcePage.MODULES, write=True)
    check_project_access(module.project, g.current_user, write=True)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        module.name = data["name"]
    if "description" in data:
        module.description = data["description"]
    db.session.commit()
    return jsonify(module.to_dict(include_counts=True))


@modules_bp.delete("/modules/<int:module_id>")
@login_required
def delete_module(module_id):
    module = get_module_or_404(module_id)
    require_page_access(g.current_user, ResourcePage.MODULES, write=True)
    check_project_access(module.project, g.current_user, write=True)
    db.session.delete(module)
    db.session.commit()
    return jsonify({"success": True})
