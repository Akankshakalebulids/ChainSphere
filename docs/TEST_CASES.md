# SmartChain – Test Cases & Quality Assurance Matrix

---

## 1. Test Strategy & Scope
The SmartChain system undergoes systematic testing across multiple layers:
1. **Unit & Integration Testing (Automated):** Executed via `pytest` and `httpx.TestClient` against isolated database fixtures.
2. **System & Validation Testing:** Verifying transactional integrity, inventory decrementing, and business logic constraints.
3. **User Acceptance Testing (UAT):** Testing frontend responsiveness, modal interactions, search filters, and tracking lookups.

---

## 2. Test Case Matrix

| Test ID | Module | Test Scenario | Pre-Conditions | Test Steps | Expected Output | Status |
|---|---|---|---|---|---|---|
| **TC-SYS-01** | System | Backend Health Endpoint Check | Backend API service active | Send `GET /api/health` | HTTP 200, `{"status": "healthy"}` | **PASSED** |
| **TC-PROD-01** | Products | Create Product with Valid Data | Supplier exists (ID=1) | Send `POST /api/products/` with unique SKU, price, stock | HTTP 201 Created, product record saved and returned | **PASSED** |
| **TC-PROD-02** | Products | Prevent Duplicate SKU Creation | Product with SKU `PRD-ELEC-101` exists | Send `POST /api/products/` with SKU `PRD-ELEC-101` | HTTP 400 Bad Request, message stating SKU already exists | **PASSED** |
| **TC-PROD-03** | Products | Filter Products Below Reorder Threshold | Database contains items with stock <= threshold | Send `GET /api/products/low-stock` | HTTP 200, array where all items have `quantity_in_stock <= reorder_threshold` | **PASSED** |
| **TC-PROD-04** | Products | Quick Restock Inventory Adjustment | Product exists with stock=10 | Send `POST /api/products/{id}/stock-adjustment` with `+15` | HTTP 200, product `quantity_in_stock` updated to 25 | **PASSED** |
| **TC-PROD-05** | Products | Prevent Negative Inventory via Adjustment | Product exists with stock=10 | Send `POST /api/products/{id}/stock-adjustment` with `-25` | HTTP 400 Bad Request, cannot reduce stock below 0 | **PASSED** |
| **TC-SUPP-01** | Suppliers | Register New Supplier Partner | Unique corporate email | Send `POST /api/suppliers/` with valid name, email, rating | HTTP 201 Created, supplier ID assigned | **PASSED** |
| **TC-SUPP-02** | Suppliers | Enforce Supplier Email Uniqueness | Supplier with email `test@vendor.com` exists | Send `POST /api/suppliers/` with identical email | HTTP 400 Bad Request, email already registered | **PASSED** |
| **TC-ORD-01** | Orders | Place Order with Sufficient Stock | Product stock = 50 | Send `POST /api/orders/` requesting quantity = 5 | HTTP 201 Created, order assigned `ORD-YYYYMMDD-XXXX`, product stock decremented to 45 | **PASSED** |
| **TC-ORD-02** | Orders | Reject Order Exceeding Available Stock | Product stock = 5 | Send `POST /api/orders/` requesting quantity = 100 | HTTP 400 Bad Request, message: *"Insufficient inventory"* | **PASSED** |
| **TC-ORD-03** | Orders | Replenish Inventory on Order Cancellation | Order created with 5 units; product stock was reduced | Send `PATCH /api/orders/{id}/status` with `status: "Cancelled"` | HTTP 200, product stock restored by 5 units | **PASSED** |
| **TC-SHIP-01** | Shipments | Dispatch Shipment & Generate Tracking | Order exists in `Pending` status | Send `POST /api/shipments/` with order_id and carrier | HTTP 201 Created, tracking code `TRK-SC-XXXXXX` generated, order status set to `Shipped` | **PASSED** |
| **TC-SHIP-02** | Shipments | Track Shipment via Tracking Number | Shipment exists with `TRK-SC-98214A1` | Send `GET /api/shipments/track/TRK-SC-98214A1` | HTTP 200, returns full waypoint checkpoints and carrier info | **PASSED** |
| **TC-SHIP-03** | Shipments | Auto-Mark Order Delivered on Delivery | Shipment status is `In Transit` | Send `PATCH /api/shipments/{id}/status` with `status: "Delivered"` | HTTP 200, shipment status updated to Delivered and associated Order status automatically synced to `Delivered` | **PASSED** |
| **TC-DASH-01** | Dashboard | Compute Inventory Valuation & KPIs | Multiple products and orders stored | Send `GET /api/dashboard/metrics` | HTTP 200, returns correct mathematical sum of `unit_price * stock`, active shipments, and low-stock count | **PASSED** |

---

## 3. Automated Test Execution Evidence
- **Framework:** Pytest 8.4.2
- **Test File:** `backend/tests/test_api.py`
- **Result:** `10 passed in 5.58s (100% success rate)`
```
============================= test session starts =============================
test_api.py::test_health_check PASSED                                    [ 10%]
test_api.py::test_dashboard_metrics PASSED                                [ 20%]
test_api.py::test_get_suppliers PASSED                                    [ 30%]
test_api.py::test_create_supplier PASSED                                  [ 40%]
test_api.py::test_create_product PASSED                                   [ 50%]
test_api.py::test_low_stock_filter PASSED                                 [ 60%]
test_api.py::test_adjust_stock PASSED                                     [ 70%]
test_api.py::test_order_placement_and_inventory_deduction PASSED          [ 80%]
test_api.py::test_order_insufficient_stock_fails PASSED                    [ 90%]
test_api.py::test_shipment_creation_and_status PASSED                     [100%]
======================== 10 passed in 5.58s ========================
```
