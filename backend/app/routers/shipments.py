from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ShipmentCreate, ShipmentUpdateStatus, ShipmentOut
from app import crud

router = APIRouter(prefix="/shipments", tags=["Shipment Tracking"])

@router.get("/", response_model=List[ShipmentOut])
def read_shipments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (In Transit, Out for Delivery, Delivered, Delayed)"),
    db: Session = Depends(get_db)
):
    """List shipments with real-time tracking information."""
    return crud.get_shipments(db=db, skip=skip, limit=limit, status_filter=status_filter)

@router.get("/track/{tracking_number}", response_model=ShipmentOut)
def track_shipment_by_number(tracking_number: str, db: Session = Depends(get_db)):
    """Public tracking lookup by tracking number."""
    return crud.get_shipment_by_tracking(db=db, tracking_number=tracking_number)

@router.get("/{shipment_id}", response_model=ShipmentOut)
def read_shipment(shipment_id: int, db: Session = Depends(get_db)):
    """Get single shipment record by ID."""
    return crud.get_shipment(db=db, shipment_id=shipment_id)

@router.post("/", response_model=ShipmentOut, status_code=status.HTTP_201_CREATED)
def create_new_shipment(shipment_in: ShipmentCreate, db: Session = Depends(get_db)):
    """Dispatch an order and generate a tracking number."""
    return crud.create_shipment(db=db, shipment_in=shipment_in)

@router.patch("/{shipment_id}/status", response_model=ShipmentOut)
def update_tracking_status(shipment_id: int, update_in: ShipmentUpdateStatus, db: Session = Depends(get_db)):
    """Update shipment transit status and checkpoint location."""
    return crud.update_shipment_status(db=db, shipment_id=shipment_id, update_in=update_in)

@router.delete("/{shipment_id}")
def delete_shipment_record(shipment_id: int, db: Session = Depends(get_db)):
    """Delete shipment record."""
    return crud.delete_shipment(db=db, shipment_id=shipment_id)
