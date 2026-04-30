from marshmallow_sqlalchemy import SQLAlchemySchema

from ..sa_db import db_session


class BaseSchema(SQLAlchemySchema):
    class Meta:
        sqla_session = db_session

