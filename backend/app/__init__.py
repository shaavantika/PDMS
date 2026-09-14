from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from app.extensions import db, migrate, jwt
from app.utils.errors import register_error_handlers


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}, r"/auth/*": {"origins": app.config["CORS_ORIGINS"]}})

    from app.auth.routes import auth_bp
    from app.blueprints.users import users_bp
    from app.blueprints.projects import projects_bp
    from app.blueprints.modules import modules_bp
    from app.blueprints.requirements import requirements_bp
    from app.blueprints.tasks import tasks_bp
    from app.blueprints.milestones import milestones_bp
    from app.blueprints.deliveries import deliveries_bp
    from app.blueprints.groups import groups_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(modules_bp, url_prefix="/api")
    app.register_blueprint(requirements_bp, url_prefix="/api")
    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(milestones_bp, url_prefix="/api")
    app.register_blueprint(deliveries_bp, url_prefix="/api")
    app.register_blueprint(groups_bp, url_prefix="/api/groups")

    register_error_handlers(app)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    return app
