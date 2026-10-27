import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from fastapi import HTTPException, status

from app.models import Supplier, Product, Order, OrderItem, Shipment
from app.schemas import (
    SupplierCreate, SupplierUpdate,
    ProductCreate, ProductUpdate,
    OrderCreate, OrderUpdateStatus,
    ShipmentCreate, ShipmentUpdateStatus,
    DashboardMetrics, CategoryStat, OrderStatusStat,
    ProductOut, OrderOut, OrderItemOut, ShipmentOut
)


# ==============================================================================
# SUPPLIERS CRUD
# ==============================================================================
def get_suppliers(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(Supplier)
    if search:
        query = query.filter(
            or_(
                Supplier.name.ilike(f"%{search}%"),
                Supplier.email.ilike(f"%{search}%"),
                Supplier.city.ilike(f"%{search}%")
            )
        )
    return query.order_by(Supplier.name.asc()).offset(skip).limit(limit).all()

def get_supplier(db: Session, supplier_id: int):
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()

def create_supplier(db: Session, supplier_in: SupplierCreate):
    existing = db.query(Supplier).filter(Supplier.email == supplier_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supplier with email '{supplier_in.email}' already exists."
        )
    db_supplier = Supplier(**supplier_in.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def update_supplier(db: Session, supplier_id: int, supplier_in: SupplierUpdate):
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != db_supplier.email:
        existing = db.query(Supplier).filter(Supplier.email == update_data["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken by another supplier")
            
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def delete_supplier(db: Session, supplier_id: int):
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(db_supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}


# ==============================================================================
# PRODUCTS CRUD
# ==============================================================================
def serialize_product(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        sku=p.sku,
        name=p.name,
        category=p.category,
        description=p.description,
        unit_price=p.unit_price,
        cost_price=p.cost_price,
        quantity_in_stock=p.quantity_in_stock,
        reorder_threshold=p.reorder_threshold,
        warehouse_location=p.warehouse_location,
        supplier_id=p.supplier_id,
        supplier_name=p.supplier.name if p.supplier else None,
        is_low_stock=(p.quantity_in_stock <= p.reorder_threshold),
        created_at=p.created_at,
        updated_at=p.updated_at
    )

def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock_only: bool = False
) -> List[ProductOut]:
    query = db.query(Product).options(joinedload(Product.supplier))
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.category.ilike(f"%{search}%")
            )
        )
    if category and category != "All":
        query = query.filter(Product.category == category)
    if low_stock_only:
        query = query.filter(Product.quantity_in_stock <= Product.reorder_threshold)
    
    products = query.order_by(Product.name.asc()).offset(skip).limit(limit).all()
    return [serialize_product(p) for p in products]

def get_product(db: Session, product_id: int):
    product = db.query(Product).options(joinedload(Product.supplier)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)

def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku).first()

def create_product(db: Session, product_in: ProductCreate) -> ProductOut:
    existing = get_product_by_sku(db, product_in.sku)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Product with SKU '{product_in.sku}' already exists."
        )
    
    if product_in.supplier_id:
        supplier = get_supplier(db, product_in.supplier_id)
        if not supplier:
            raise HTTPException(status_code=400, detail="Specified supplier_id does not exist")

    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return get_product(db, db_product.id)

def update_product(db: Session, product_id: int, product_in: ProductUpdate) -> ProductOut:
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise HTTPException(status_code=400, detail="SKU already taken by another product")

    if "supplier_id" in update_data and update_data["supplier_id"]:
        if not get_supplier(db, update_data["supplier_id"]):
            raise HTTPException(status_code=400, detail="Specified supplier_id does not exist")

    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return get_product(db, db_product.id)

def adjust_product_stock(db: Session, product_id: int, adjustment: int) -> ProductOut:
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_stock = db_product.quantity_in_stock + adjustment
    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce stock below 0. Current stock: {db_product.quantity_in_stock}"
        )
    db_product.quantity_in_stock = new_stock
    db.commit()
    db.refresh(db_product)
    return get_product(db, db_product.id)

def delete_product(db: Session, product_id: int):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}


# ==============================================================================
# ORDERS CRUD
# ==============================================================================
def serialize_order(o: Order) -> OrderOut:
    items_out = []
    for item in o.items:
        items_out.append(OrderItemOut(
            id=item.id,
            order_id=item.order_id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "Deleted Product",
            product_sku=item.product.sku if item.product else "",
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal
        ))
    return OrderOut(
        id=o.id,
        order_number=o.order_number,
        customer_name=o.customer_name,
        customer_email=o.customer_email,
        customer_phone=o.customer_phone,
        shipping_address=o.shipping_address,
        total_amount=o.total_amount,
        status=o.status,
        payment_status=o.payment_status,
        order_date=o.order_date,
        created_at=o.created_at,
        updated_at=o.updated_at,
        items=items_out
    )

def get_orders(db: Session, skip: int = 0, limit: int = 100, status_filter: Optional[str] = None):
    query = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product)
    )
    if status_filter and status_filter != "All":
        query = query.filter(Order.status == status_filter)
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return [serialize_order(o) for o in orders]

def get_order(db: Session, order_id: int) -> OrderOut:
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order)

def create_order(db: Session, order_in: OrderCreate) -> OrderOut:
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    # Validate inventory availability first
    total_amount = 0.0
    items_to_add = []
    
    for item in order_in.items:
        query = db.query(Product).filter(Product.id == item.product_id)
        if db.bind and db.bind.dialect.name == "mysql":
            query = query.with_for_update()
        product = query.first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory for '{product.name}'. Available: {product.quantity_in_stock}, Requested: {item.quantity}"
            )
        # Deduct stock
        product.quantity_in_stock -= item.quantity
        subtotal = round(product.unit_price * item.quantity, 2)
        total_amount += subtotal

        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.unit_price,
            subtotal=subtotal
        )
        items_to_add.append(order_item)

    # Generate unique order number
    now_str = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:4].upper()
    order_number = f"ORD-{now_str}-{unique_suffix}"

    db_order = Order(
        order_number=order_number,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        total_amount=round(total_amount, 2),
        status="Pending",
        payment_status=order_in.payment_status or "Paid",
        order_date=datetime.utcnow()
    )
    db.add(db_order)
    db.flush()

    for item in items_to_add:
        item.order_id = db_order.id
        db.add(item)

    db.commit()
    db.refresh(db_order)
    return get_order(db, db_order.id)

def update_order_status(db: Session, order_id: int, status_update: OrderUpdateStatus) -> OrderOut:
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    new_status = status_update.status

    # If cancelling, replenish stock
    if new_status == "Cancelled" and old_status != "Cancelled":
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity_in_stock += item.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)
    return get_order(db, order.id)

def delete_order(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}


# ==============================================================================
# SHIPMENTS CRUD
# ==============================================================================
def serialize_shipment(s: Shipment) -> ShipmentOut:
    return ShipmentOut(
        id=s.id,
        tracking_number=s.tracking_number,
        order_id=s.order_id,
        order_number=s.order.order_number if s.order else None,
        carrier=s.carrier,
        origin=s.origin,
        destination=s.destination,
        current_location=s.current_location,
        status=s.status,
        estimated_delivery=s.estimated_delivery,
        dispatched_at=s.dispatched_at,
        delivered_at=s.delivered_at,
        notes=s.notes,
        updated_at=s.updated_at
    )

def get_shipments(db: Session, skip: int = 0, limit: int = 100, status_filter: Optional[str] = None):
    query = db.query(Shipment).options(joinedload(Shipment.order))
    if status_filter and status_filter != "All":
        query = query.filter(Shipment.status == status_filter)
    shipments = query.order_by(Shipment.dispatched_at.desc()).offset(skip).limit(limit).all()
    return [serialize_shipment(s) for s in shipments]

def get_shipment(db: Session, shipment_id: int) -> ShipmentOut:
    s = db.query(Shipment).options(joinedload(Shipment.order)).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return serialize_shipment(s)

def get_shipment_by_tracking(db: Session, tracking_number: str) -> ShipmentOut:
    s = db.query(Shipment).options(joinedload(Shipment.order)).filter(Shipment.tracking_number == tracking_number).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment with tracking number not found")
    return serialize_shipment(s)

def create_shipment(db: Session, shipment_in: ShipmentCreate) -> ShipmentOut:
    # Verify order exists
    order = db.query(Order).filter(Order.id == shipment_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order already has an active shipment
    existing = db.query(Shipment).filter(Shipment.order_id == shipment_in.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A shipment already exists for this order.")

    tracking_number = f"TRK-SC-{uuid.uuid4().hex[:8].upper()}"
    est_delivery = shipment_in.estimated_delivery or (datetime.utcnow() + timedelta(days=3))

    db_shipment = Shipment(
        tracking_number=tracking_number,
        order_id=shipment_in.order_id,
        carrier=shipment_in.carrier,
        origin=shipment_in.origin or "Central Logistics Park, Hub 1",
        destination=shipment_in.destination,
        current_location=shipment_in.current_location or "Origin Sorting Facility",
        status=shipment_in.status or "In Transit",
        estimated_delivery=est_delivery,
        dispatched_at=datetime.utcnow(),
        notes=shipment_in.notes
    )

    # Automatically set Order status to Shipped
    if order.status in ["Pending", "Processing"]:
        order.status = "Shipped"

    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return get_shipment(db, db_shipment.id)

def update_shipment_status(db: Session, shipment_id: int, update_in: ShipmentUpdateStatus) -> ShipmentOut:
    s = db.query(Shipment).options(joinedload(Shipment.order)).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")

    s.status = update_in.status
    if update_in.current_location:
        s.current_location = update_in.current_location
    if update_in.notes:
        s.notes = update_in.notes

    if update_in.status == "Delivered":
        s.delivered_at = datetime.utcnow()
        if s.order:
            s.order.status = "Delivered"

    db.commit()
    db.refresh(s)
    return serialize_shipment(s)

def delete_shipment(db: Session, shipment_id: int):
    s = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    db.delete(s)
    db.commit()
    return {"message": "Shipment deleted successfully"}


# ==============================================================================
# DASHBOARD AGGREGATIONS
# ==============================================================================
def get_dashboard_metrics(db: Session) -> DashboardMetrics:
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_valuation = db.query(func.sum(Product.unit_price * Product.quantity_in_stock)).scalar() or 0.0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status != "Cancelled").scalar() or 0.0
    
    # Low stock items: where quantity_in_stock <= reorder_threshold
    low_stock_query = db.query(Product).options(joinedload(Product.supplier)).filter(
        Product.quantity_in_stock <= Product.reorder_threshold
    )
    low_stock_count = low_stock_query.count()
    urgent_low_stock = [serialize_product(p) for p in low_stock_query.limit(10).all()]

    active_shipments_count = db.query(func.count(Shipment.id)).filter(
        Shipment.status.in_(["In Transit", "Out for Delivery", "Delayed"])
    ).scalar() or 0

    # Category distribution
    cat_results = db.query(
        Product.category,
        func.count(Product.id).label("count"),
        func.sum(Product.quantity_in_stock).label("stock")
    ).group_by(Product.category).all()

    category_distribution = [
        CategoryStat(
            category=row[0],
            product_count=row[1],
            total_stock=int(row[2] or 0)
        ) for row in cat_results
    ]

    # Order status breakdown
    order_status_results = db.query(
        Order.status,
        func.count(Order.id).label("count")
    ).group_by(Order.status).all()

    order_status_distribution = [
        OrderStatusStat(
            status=row[0],
            count=row[1]
        ) for row in order_status_results
    ]

    # Recent Orders
    recent_orders_raw = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.created_at.desc()).limit(5).all()
    recent_orders = [serialize_order(o) for o in recent_orders_raw]

    # Recent Shipments
    recent_shipments_raw = db.query(Shipment).options(
        joinedload(Shipment.order)
    ).order_by(Shipment.dispatched_at.desc()).limit(5).all()
    recent_shipments = [serialize_shipment(s) for s in recent_shipments_raw]

    return DashboardMetrics(
        total_products=total_products,
        total_inventory_valuation=round(total_valuation, 2),
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        low_stock_count=low_stock_count,
        active_shipments_count=active_shipments_count,
        category_distribution=category_distribution,
        order_status_distribution=order_status_distribution,
        urgent_low_stock=urgent_low_stock,
        recent_orders=recent_orders,
        recent_shipments=recent_shipments
    )
