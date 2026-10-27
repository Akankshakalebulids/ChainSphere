from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import OrderCreate, OrderUpdateStatus, OrderOut
from app import crud

router = APIRouter(prefix="/orders", tags=["Customer Orders"])

@router.get("/", response_model=List[OrderOut])
def read_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Pending, Processing, Shipped, Delivered, Cancelled)"),
    db: Session = Depends(get_db)
):
    """Retrieve customer orders with optional status filter."""
    return crud.get_orders(db=db, skip=skip, limit=limit, status_filter=status_filter)

@router.get("/{order_id}", response_model=OrderOut)
def read_order(order_id: int, db: Session = Depends(get_db)):
    """Get single order details including ordered items and prices."""
    return crud.get_order(db=db, order_id=order_id)

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """Create a new customer order and automatically deduct inventory stock."""
    return crud.create_order(db=db, order_in=order_in)

@router.patch("/{order_id}/status", response_model=OrderOut)
def change_order_status(order_id: int, status_update: OrderUpdateStatus, db: Session = Depends(get_db)):
    """Update order fulfillment status (Pending -> Processing -> Shipped -> Delivered or Cancelled)."""
    return crud.update_order_status(db=db, order_id=order_id, status_update=status_update)

@router.delete("/{order_id}")
def delete_order_record(order_id: int, db: Session = Depends(get_db)):
    """Delete an order record."""
    return crud.delete_order(db=db, order_id=order_id)
