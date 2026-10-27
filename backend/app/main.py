import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal, DB_ENGINE_TYPE
from app.seed_data import seed_initial_data
from app.routers import products, suppliers, orders, shipments, dashboard

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("smartchain.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Create tables if not present
    logger.info("Initializing SmartChain database tables...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed initial data
    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
    
    logger.info(f"SmartChain Backend initialized successfully using [{DB_ENGINE_TYPE.upper()}] engine.")
    yield
    # Shutdown
    logger.info("Shutting down SmartChain backend...")

app = FastAPI(
    title="SmartChain – Supply Chain Management System API",
    description="Full-stack Enterprise Supply Chain REST API with Inventory, Orders, Tracking, and Analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(suppliers.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(shipments.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "SmartChain – Supply Chain Management System",
        "status": "online",
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR,
        "database_engine": DB_ENGINE_TYPE
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": DB_ENGINE_TYPE,
        "version": "1.0.0"
    }
