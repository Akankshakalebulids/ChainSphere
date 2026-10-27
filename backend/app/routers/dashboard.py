from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DashboardMetrics
from app import crud

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/metrics", response_model=DashboardMetrics)
def read_dashboard_statistics(db: Session = Depends(get_db)):
    """Retrieve summarized supply chain KPI metrics, inventory valuation, and recent activities."""
    return crud.get_dashboard_metrics(db=db)
