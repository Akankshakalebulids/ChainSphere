from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ProductCreate, ProductUpdate, ProductOut, ProductStockUpdate
from app import crud

router = APIRouter(prefix="/products", tags=["Products & Inventory"])

@router.get("/", response_model=List[ProductOut])
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by name, SKU, or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Filter low-stock products"),
    db: Session = Depends(get_db)
):
    """Retrieve all products with optional search, category filter, and pagination."""
    return crud.get_products(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        low_stock_only=low_stock_only
    )

@router.get("/low-stock", response_model=List[ProductOut])
def read_low_stock_products(db: Session = Depends(get_db)):
    """Retrieve only products where current stock <= minimum reorder threshold."""
    return crud.get_products(db=db, low_stock_only=True)

@router.get("/{product_id}", response_model=ProductOut)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Get single product details by ID."""
    return crud.get_product(db=db, product_id=product_id)

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_new_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """Add a new product to inventory."""
    return crud.create_product(db=db, product_in=product_in)

@router.put("/{product_id}", response_model=ProductOut)
def update_product_details(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """Update product information."""
    return crud.update_product(db=db, product_id=product_id, product_in=product_in)

@router.post("/{product_id}/stock-adjustment", response_model=ProductOut)
def adjust_inventory_stock(product_id: int, stock_in: ProductStockUpdate, db: Session = Depends(get_db)):
    """Quick restock or manual stock adjustment."""
    return crud.adjust_product_stock(db=db, product_id=product_id, adjustment=stock_in.adjustment)

@router.delete("/{product_id}")
def delete_product_item(product_id: int, db: Session = Depends(get_db)):
    """Delete a product from the catalog."""
    return crud.delete_product(db=db, product_id=product_id)
