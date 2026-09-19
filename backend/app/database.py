import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# SQLite by default so the project runs with no setup. Point DATABASE_URL at a
# Postgres instance and nothing else has to change.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./meetly.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns() -> None:
    """Add any model column the existing database is missing.

    The project is small enough that a migration tool would be more machinery
    than it earns. Columns here are always nullable or defaulted, so adding one
    to an existing meetly.db keeps the seeded data intact.
    """
    import app.models  # noqa: F401  registers the tables on Base.metadata

    inspector = inspect(engine)

    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if table.name not in inspector.get_table_names():
                continue

            existing = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing:
                    continue
                type_sql = column.type.compile(engine.dialect)
                connection.exec_driver_sql(
                    f"ALTER TABLE {table.name} ADD COLUMN {column.name} {type_sql}"
                )
