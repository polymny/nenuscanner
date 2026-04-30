import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

from . import config


def _default_sqlalchemy_url() -> str:
    # Keep the existing SQLite DB file by default, but access it through SQLAlchemy.
    db_path = os.path.abspath(config.DATABASE_PATH)
    return f'sqlite+pysqlite:///{db_path}'


def get_engine() -> Engine:
    url = os.getenv('SQLALCHEMY_DATABASE_URL', _default_sqlalchemy_url())
    # `future=True` is the default in SQLAlchemy 2.x; explicit is clearer here.
    return create_engine(url, future=True)


engine = get_engine()

db_session = scoped_session(
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        future=True,
    )
)

Base = declarative_base()
Base.query = db_session.query_property()


def init_db() -> None:
    # Import models so they register on Base.metadata before create_all.
    from .app.models import object2  # noqa: F401

    Base.metadata.create_all(bind=engine)


def main() -> None:
    # Callable initializer, but minimal: ensure the data dir exists and create SQLAlchemy tables.
    os.makedirs(config.DATA_DIR, exist_ok=True)
    init_db()


if __name__ == '__main__':
    main()
