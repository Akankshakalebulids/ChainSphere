from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, EmailStr

# ----------------- Supplier Schemas -----------------
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    phone: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field("India", max_length=100)
    lead_time_days: int = Field(7, ge=1, le=90)
    rating: float = Field(4.5, ge=1.0, le=5.0)
    is_active: bool = Field(True)

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    lead_time_days: Optional[int] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None

class SupplierOut(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------- Product Schemas -----------------
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    unit_price: float = Field(..., gt=0)
    cost_price: float = Field(0.0, ge=0)
    quantity_in_stock: int = Field(..., ge=0)
    reorder_threshold: int = Field(10, ge=0)
    warehouse_location: Optional[str] = Field("Aisle 1, Bay A", max_length=50)
    supplier_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None
    quantity_in_stock: Optional[int] = None
    reorder_threshold: Optional[int] = None
    warehouse_location: Optional[str] = None
    supplier_id: Optional[int] = None

class ProductStockUpdate(BaseModel):
    adjustment: int
    reason: Optional[str] = Field("Manual adjustment", max_length=100)

class ProductOut(ProductBase):
    id: int
    is_low_stock: bool = False
    supplier_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------- Order Item Schemas -----------------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemOut(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    model_config = ConfigDict(from_attributes=True)


# ----------------- Order Schemas -----------------
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    customer_email: str = Field(..., min_length=5, max_length=120)
    customer_phone: Optional[str] = Field(None, max_length=30)
    shipping_address: str = Field(..., min_length=5)
    payment_status: Optional[str] = Field("Paid")
    items: List[OrderItemCreate] = Field(..., min_length=1)

class OrderUpdateStatus(BaseModel):
    status: str

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    shipping_address: str
    total_amount: float
    status: str
    payment_status: str
    order_date: datetime
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


# ----------------- Shipment Schemas -----------------
class ShipmentCreate(BaseModel):
    order_id: int
    carrier: str
    origin: Optional[str] = "Central Hub, Bhiwandi, Maharashtra"
    destination: str
    current_location: Optional[str] = "Bhiwandi Sorting Facility"
    status: Optional[str] = "In Transit"
    estimated_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class ShipmentUpdateStatus(BaseModel):
    status: str
    current_location: Optional[str] = None
    notes: Optional[str] = None

class ShipmentOut(BaseModel):
    id: int
    tracking_number: str
    order_id: int
    order_number: Optional[str] = None
    carrier: str
    origin: str
    destination: str
    current_location: str
    status: str
    estimated_delivery: Optional[datetime] = None
    dispatched_at: datetime
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------- Dashboard Schemas -----------------
class CategoryStat(BaseModel):
    category: str
    product_count: int
    total_stock: int

class OrderStatusStat(BaseModel):
    status: str
    count: int

class DashboardMetrics(BaseModel):
    total_products: int
    total_inventory_valuation: float
    total_orders: int
    total_revenue: float
    low_stock_count: int
    active_shipments_count: int
    category_distribution: List[CategoryStat]
    order_status_distribution: List[OrderStatusStat]
    urgent_low_stock: List[ProductOut]
    recent_orders: List[OrderOut]
    recent_shipments: List[ShipmentOut]
