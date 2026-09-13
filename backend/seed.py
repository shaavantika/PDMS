"""One-off script to create an initial admin user. Run after `flask db upgrade`."""
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import User, UserRole

app = create_app()

with app.app_context():
    if User.query.filter_by(email="admin@projectsync.dev").first():
        print("Admin user already exists, skipping.")
    else:
        admin = User(
            email="admin@projectsync.dev",
            name="Admin",
            role=UserRole.ADMIN,
            password_hash=generate_password_hash("admin123"),
            is_approved=True,
        )
        db.session.add(admin)
        db.session.commit()
        print("Created admin user: admin@projectsync.dev / admin123")
