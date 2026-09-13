from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from sqlalchemy import MetaData

db = SQLAlchemy(metadata=MetaData(schema="pdms"))
migrate = Migrate()
jwt = JWTManager()
