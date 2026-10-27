import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.seed_data import seed_initial_data

# Use in-memory SQLite database with StaticPool for isolated automated testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    seed_initial_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_dashboard_metrics(client):
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_inventory_valuation" in data
    assert "low_stock_count" in data
    assert data["total_products"] >= 5

def test_get_suppliers(client):
    response = client.get("/api/suppliers/")
    assert response.status_code == 200
    suppliers = response.json()
    assert len(suppliers) >= 1

def test_create_supplier(client):
    new_supplier = {
        "name": "Global Test Robotics Ltd",
        "contact_person": "Rohan Deshmukh",
        "email": "rohan.d@globalrobotics.com",
        "phone": "+91 9999988888",
        "address": "Tech Zone 2, Hinjewadi",
        "city": "Pune",
        "country": "India",
        "lead_time_days": 4,
        "rating": 4.8,
        "is_active": True
    }
    response = client.post("/api/suppliers/", json=new_supplier)
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == new_supplier["name"]
    assert created["email"] == new_supplier["email"]
    assert "id" in created

def test_create_product(client):
    suppliers = client.get("/api/suppliers/").json()
    supplier_id = suppliers[0]["id"]

    new_product = {
        "sku": "PRD-TEST-9999",
        "name": "Industrial Micro PLC 24V",
        "category": "Electronics",
        "description": "Compact programmable logic controller for automation",
        "unit_price": 3200.0,
        "cost_price": 2100.0,
        "quantity_in_stock": 50,
        "reorder_threshold": 10,
        "warehouse_location": "Rack T-01",
        "supplier_id": supplier_id
    }
    response = client.post("/api/products/", json=new_product)
    assert response.status_code == 201
    created = response.json()
    assert created["sku"] == "PRD-TEST-9999"
    assert created["quantity_in_stock"] == 50

def test_low_stock_filter(client):
    response = client.get("/api/products/low-stock")
    assert response.status_code == 200
    low_stock_items = response.json()
    assert isinstance(low_stock_items, list)
    for item in low_stock_items:
        assert item["quantity_in_stock"] <= item["reorder_threshold"]

def test_adjust_stock(client):
    products = client.get("/api/products/").json()
    product = products[0]
    initial_stock = product["quantity_in_stock"]

    # Restock +10 units
    response = client.post(
        f"/api/products/{product['id']}/stock-adjustment",
        json={"adjustment": 10, "reason": "Restock batch"}
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["quantity_in_stock"] == initial_stock + 10

def test_order_placement_and_inventory_deduction(client):
    products = client.get("/api/products/").json()
    target_product = next(p for p in products if p["quantity_in_stock"] >= 5)
    initial_stock = target_product["quantity_in_stock"]

    order_payload = {
        "customer_name": "Test Labs Inc",
        "customer_email": "test@labs.com",
        "customer_phone": "+91 9123456789",
        "shipping_address": "77 Testing Boulevard, Software Park, Pune",
        "payment_status": "Paid",
        "items": [
            {
                "product_id": target_product["id"],
                "quantity": 2
            }
        ]
    }
    response = client.post("/api/orders/", json=order_payload)
    assert response.status_code == 201
    order_data = response.json()
    assert "order_number" in order_data
    assert order_data["status"] == "Pending"

    # Verify stock got deducted by 2
    refetched_product = client.get(f"/api/products/{target_product['id']}").json()
    assert refetched_product["quantity_in_stock"] == initial_stock - 2

def test_order_insufficient_stock_fails(client):
    products = client.get("/api/products/").json()
    product = products[0]

    excessive_order = {
        "customer_name": "Greedy Buyer",
        "customer_email": "greedy@buyer.com",
        "shipping_address": "Nowhere",
        "items": [
            {
                "product_id": product["id"],
                "quantity": 999999
            }
        ]
    }
    response = client.post("/api/orders/", json=excessive_order)
    assert response.status_code == 400
    assert "Insufficient inventory" in response.json()["detail"]

def test_shipment_creation_and_status(client):
    products = client.get("/api/products/").json()
    target_product = next(p for p in products if p["quantity_in_stock"] >= 1)
    order_payload = {
        "customer_name": "Shipment Test Customer",
        "customer_email": "ship@test.com",
        "shipping_address": "Hub 5, Logistics Park",
        "items": [{"product_id": target_product["id"], "quantity": 1}]
    }
    order = client.post("/api/orders/", json=order_payload).json()

    # Create shipment
    shipment_payload = {
        "order_id": order["id"],
        "carrier": "BlueDart Express",
        "origin": "Central Hub",
        "destination": "Hub 5, Logistics Park",
        "current_location": "Central Dispatch Desk",
        "status": "In Transit"
    }
    ship_res = client.post("/api/shipments/", json=shipment_payload)
    assert ship_res.status_code == 201
    shipment_data = ship_res.json()
    assert "tracking_number" in shipment_data
    assert shipment_data["status"] == "In Transit"

    # Update shipment status to Delivered
    update_res = client.patch(
        f"/api/shipments/{shipment_data['id']}/status",
        json={"status": "Delivered", "current_location": "Customer Front Desk"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Delivered"

    # Verify parent order status is now also marked as Delivered
    updated_order = client.get(f"/api/orders/{order['id']}").json()
    assert updated_order["status"] == "Delivered"
