import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("smartchain.database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def get_engine():
    """
    Creates the SQLAlchemy engine.
    Tries MySQL first. If MySQL is unreachable, seamlessly falls back to SQLite.
    """
    primary_url = settings.DATABASE_URL
    try:
        if "sqlite" in primary_url:
            engine = create_engine(primary_url, connect_args={"check_same_thread": False})
            logger.info("Using SQLite database engine.")
            return engine, "sqlite"
        else:
            engine = create_engine(primary_url, pool_pre_ping=True, pool_recycle=3600)
            # Test connectivity
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected successfully to MySQL database.")
            return engine, "mysql"
    except Exception as e:
        logger.warning(
            "Could not connect to the primary database. "
            "Reason: %s. Falling back to SQLite for local development.",
            e,
        )
        sqlite_engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        return sqlite_engine, "sqlite"

engine, DB_ENGINE_TYPE = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
