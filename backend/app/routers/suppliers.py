from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SupplierCreate, SupplierUpdate, SupplierOut
from app import crud

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[SupplierOut])
def read_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by name, email, or city"),
    db: Session = Depends(get_db)
):
    """Retrieve list of registered suppliers."""
    return crud.get_suppliers(db=db, skip=skip, limit=limit, search=search)

@router.get("/{supplier_id}", response_model=SupplierOut)
def read_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get single supplier by ID."""
    db_supplier = crud.get_supplier(db=db, supplier_id=supplier_id)
    if not db_supplier:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@router.post("/", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_new_supplier(supplier_in: SupplierCreate, db: Session = Depends(get_db)):
    """Register a new supplier partner."""
    return crud.create_supplier(db=db, supplier_in=supplier_in)

@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier_details(supplier_id: int, supplier_in: SupplierUpdate, db: Session = Depends(get_db)):
    """Update supplier information."""
    return crud.update_supplier(db=db, supplier_id=supplier_id, supplier_in=supplier_in)

@router.delete("/{supplier_id}")
def delete_supplier_partner(supplier_id: int, db: Session = Depends(get_db)):
    """Remove a supplier."""
    return crud.delete_supplier(db=db, supplier_id=supplier_id)
