import enum
from datetime import datetime, date

from app.extensions import db


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PM = "pm"
    MEMBER = "member"


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class RequirementStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


class RequirementPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"


class MilestoneStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    LATE = "late"
    COMPLETED = "completed"


class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ResourcePage(str, enum.Enum):
    PROJECTS = "projects"
    MODULES = "modules"
    REQUIREMENTS = "requirements"
    TASKS = "tasks"
    MILESTONES = "milestones"
    DELIVERIES = "deliveries"


project_members = db.Table(
    "project_members",
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id"), primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
)


class UserGroup(db.Model):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    permissions = db.relationship("GroupPermission", back_populates="group", cascade="all, delete-orphan")
    users = db.relationship("User", back_populates="group")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "permissions": [p.to_dict() for p in self.permissions],
        }


class GroupPermission(db.Model):
    __tablename__ = "group_permissions"
    __table_args__ = (db.UniqueConstraint("group_id", "page", name="uq_group_permissions_group_page"),)

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    page = db.Column(db.Enum(ResourcePage, schema="pdms"), nullable=False)
    can_read = db.Column(db.Boolean, nullable=False, default=False)
    can_write = db.Column(db.Boolean, nullable=False, default=False)

    group = db.relationship("UserGroup", back_populates="permissions")

    def to_dict(self):
        return {"page": self.page.value, "can_read": self.can_read, "can_write": self.can_write}


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole, schema="pdms"), nullable=False, default=UserRole.MEMBER)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_approved = db.Column(db.Boolean, nullable=False, default=False)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    projects_owned = db.relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    projects_member_of = db.relationship("Project", secondary=project_members, back_populates="members")
    group = db.relationship("UserGroup", back_populates="users")

    def resolved_permissions(self):
        pages = [p.value for p in ResourcePage]
        if self.role == UserRole.ADMIN:
            return {p: {"can_read": True, "can_write": True} for p in pages}
        perms = {p: {"can_read": False, "can_write": False} for p in pages}
        if self.group_id and self.group:
            for gp in self.group.permissions:
                perms[gp.page.value] = {"can_read": gp.can_read, "can_write": gp.can_write}
        return perms

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_approved": self.is_approved,
            "group_id": self.group_id,
            "group_name": self.group.name if self.group else None,
            "permissions": self.resolved_permissions(),
            "created_at": self.created_at.isoformat(),
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    client_name = db.Column(db.String(255))
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.Enum(ProjectStatus, schema="pdms"), nullable=False, default=ProjectStatus.ACTIVE)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    owner = db.relationship("User", back_populates="projects_owned", foreign_keys=[owner_id])
    members = db.relationship("User", secondary=project_members, back_populates="projects_member_of")
    modules = db.relationship("Module", back_populates="project", cascade="all, delete-orphan")
    requirements = db.relationship("Requirement", back_populates="project", cascade="all, delete-orphan")
    tasks = db.relationship("Task", back_populates="project", cascade="all, delete-orphan")
    milestones = db.relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    deliveries = db.relationship("Delivery", back_populates="project", cascade="all, delete-orphan")
    stakeholders = db.relationship("Stakeholder", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self, include_counts=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "client_name": self.client_name,
            "owner": self.owner.to_dict() if self.owner else None,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
        }
        if include_counts:
            data["requirement_count"] = len(self.requirements)
            total_tasks = len(self.tasks)
            done_tasks = len([t for t in self.tasks if t.status == TaskStatus.DONE])
            data["progress_pct"] = int((done_tasks / total_tasks) * 100) if total_tasks else 0
        data["members"] = [m.to_dict() for m in self.members]
        return data


class Module(db.Model):
    __tablename__ = "modules"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    project = db.relationship("Project", back_populates="modules")
    requirements = db.relationship("Requirement", back_populates="module", cascade="all, delete-orphan")

    def to_dict(self, include_counts=False):
        data = {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
        }
        if include_counts:
            data["requirement_count"] = len(self.requirements)
        return data


class Stakeholder(db.Model):
    __tablename__ = "stakeholders"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role_title = db.Column(db.String(255))
    email = db.Column(db.String(255))
    notes = db.Column(db.Text)

    project = db.relationship("Project", back_populates="stakeholders")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "role_title": self.role_title,
            "email": self.email,
            "notes": self.notes,
        }


class Requirement(db.Model):
    __tablename__ = "requirements"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey("modules.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    stakeholder_id = db.Column(db.Integer, db.ForeignKey("stakeholders.id"), nullable=True)
    status = db.Column(db.Enum(RequirementStatus, schema="pdms"), nullable=False, default=RequirementStatus.DRAFT)
    priority = db.Column(db.Enum(RequirementPriority, schema="pdms"), nullable=False, default=RequirementPriority.MEDIUM)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship("Project", back_populates="requirements")
    module = db.relationship("Module", back_populates="requirements")
    stakeholder = db.relationship("Stakeholder")
    creator = db.relationship("User", foreign_keys=[created_by])
    approver = db.relationship("User", foreign_keys=[approved_by])
    tasks = db.relationship("Task", back_populates="requirement")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "module_id": self.module_id,
            "title": self.title,
            "description": self.description,
            "stakeholder": self.stakeholder.to_dict() if self.stakeholder else None,
            "status": self.status.value,
            "priority": self.priority.value,
            "created_by": self.creator.to_dict() if self.creator else None,
            "approved_by": self.approver.to_dict() if self.approver else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    requirement_id = db.Column(db.Integer, db.ForeignKey("requirements.id"), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    assignee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    status = db.Column(db.Enum(TaskStatus, schema="pdms"), nullable=False, default=TaskStatus.TODO)
    progress_pct = db.Column(db.Integer, nullable=False, default=0)
    milestone_id = db.Column(db.Integer, db.ForeignKey("milestones.id"), nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship("Project", back_populates="tasks")
    requirement = db.relationship("Requirement", back_populates="tasks")
    assignee = db.relationship("User", foreign_keys=[assignee_id])
    milestone = db.relationship("Milestone", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "requirement_id": self.requirement_id,
            "requirement_title": self.requirement.title if self.requirement else None,
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "status": self.status.value,
            "progress_pct": self.progress_pct,
            "milestone_id": self.milestone_id,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Milestone(db.Model):
    __tablename__ = "milestones"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.Enum(MilestoneStatus, schema="pdms"), nullable=False, default=MilestoneStatus.NOT_STARTED)
    status_override = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship("Project", back_populates="milestones")
    tasks = db.relationship("Task", back_populates="milestone")
    deliveries = db.relationship("Delivery", back_populates="milestone")

    def compute_status(self):
        if self.status_override:
            return self.status
        tasks = self.tasks
        if not tasks:
            return MilestoneStatus.NOT_STARTED
        if all(t.status == TaskStatus.DONE for t in tasks):
            return MilestoneStatus.COMPLETED
        if self.due_date and self.due_date < date.today():
            return MilestoneStatus.LATE
        if self.due_date and (self.due_date - date.today()).days <= 3:
            return MilestoneStatus.AT_RISK
        return MilestoneStatus.ON_TRACK

    def to_dict(self):
        computed_status = self.compute_status()
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": computed_status.value,
            "status_override": self.status_override,
            "task_count": len(self.tasks),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Delivery(db.Model):
    __tablename__ = "deliveries"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    milestone_id = db.Column(db.Integer, db.ForeignKey("milestones.id"), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    artifact_url = db.Column(db.String(1024))
    description = db.Column(db.Text)
    status = db.Column(db.Enum(DeliveryStatus, schema="pdms"), nullable=False, default=DeliveryStatus.PENDING)
    delivered_at = db.Column(db.DateTime, nullable=True)
    client_response_notes = db.Column(db.Text)
    closed_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    project = db.relationship("Project", back_populates="deliveries")
    milestone = db.relationship("Milestone", back_populates="deliveries")
    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "milestone_id": self.milestone_id,
            "title": self.title,
            "artifact_url": self.artifact_url,
            "description": self.description,
            "status": self.status.value,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "client_response_notes": self.client_response_notes,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "created_by": self.creator.to_dict() if self.creator else None,
            "created_at": self.created_at.isoformat(),
        }
