# SmartChain – Supply Chain Management System
## College Project Synopsis

---

### 1. Project Title
**SmartChain – Integrated Cloud-Native Supply Chain Management & Inventory Tracking System**

### 2. Introduction
In contemporary global commerce, real-time visibility and synchronicity across warehouse operations, vendor networks, customer demand, and logistics fulfillment represent critical operational imperatives. Traditional enterprise supply chains often suffer from siloed databases, manual error-prone inventory stock counts, opaque shipment progress, and delayed purchase orders leading to stockouts or over-inventory holding costs.

**SmartChain** is an enterprise-grade, responsive, full-stack Supply Chain Management (SCM) platform engineered using **Python FastAPI**, **React (SPA)**, and **MySQL**, fully containerized via **Docker and Docker Compose**. The system consolidates catalog administration, automated safety reorder threshold alerts, multi-item order fulfillment with atomic inventory allocation, and live waypoint tracking into an intuitive single-pane-of-glass dashboard.

---

### 3. Problem Statement
Small-to-medium manufacturing and distribution organizations face substantial operational hurdles:
1. **Inventory Opacity & Stockouts:** Lack of automated threshold alerts results in critical components running out before replenishment orders are placed.
2. **Order Disconnect:** Placing orders without atomic stock checks leads to overselling, inventory misallocations, and unfulfilled customer obligations.
3. **Logistics Blind Spots:** Lack of centralized waypoint tracking prevents procurement and customer support teams from monitoring transit progress.
4. **Fragmented Data Stores:** Disjointed spreadsheets and legacy record-keeping hinder strategic executive decision-making.

---

### 4. Project Objectives
The primary objectives of the SmartChain project are:
- **Centralized Catalog & Inventory Control:** Maintain real-time stock levels, warehouse aisle/bin locations, unit pricing, cost margins, and SKU categorization.
- **Automated Safety Reorder Threshold Monitoring:** Automatically identify SKUs falling below minimum safety levels (`quantity_in_stock <= reorder_threshold`) and calculate suggested replenishment quantities.
- **Supplier Relationship Management (SRM):** Track vendor reliability ratings, average lead times in days, geographic operational locations, and direct procurement contacts.
- **Atomic Order Fulfillment:** Support multi-item customer order placement with real-time transactional inventory decrementing and automatic cancellation restocking.
- **End-to-End Shipment Waypoint Tracking:** Provide live tracking number generation, courier assignment, status updates (`In Transit`, `Out for Delivery`, `Delivered`), and timestamped delivery confirmation.
- **Executive Analytics Dashboard:** Visualize key performance indicators (KPIs), gross inventory valuation, cumulative revenue, and category stock distribution.

---

### 5. Technology Stack & Tools (100% Free & Open Source)
- **Frontend Layer:** React 18, Vite (Ultra-fast build tooling), Lucide Icons, Modern Responsive CSS3 Architecture.
- **Backend Layer:** Python 3.11+, FastAPI (Asynchronous high-performance REST API with OpenAPI/Swagger auto-generation), SQLAlchemy 2.0 ORM, Pydantic v2 (Input validation & data sanitization), PyMySQL.
- **Database Layer:** MySQL 8.0 Relational Database Management System (with automatic local SQLite fallback for seamless offline examiner evaluations).
- **Containerization & DevOps:** Docker, Docker Compose (`compose.yaml`) with health checks and volume persistence.
- **Quality Assurance & Testing:** Pytest, HTTPX TestClient, automated unit and integration test suite.
- **Project Management:** Jira Agile Framework (Epics, User Stories, Sprints 1–4, Acceptance Criteria, Kanban/Scrum Board).

---

### 6. System Scope & Functional Modules
1. **Module 1 – Executive KPI Dashboard:** Real-time summary tiles, inventory valuation, active shipments counter, and urgent low-stock alerts.
2. **Module 2 – Product & Inventory Master:** Complete CRUD operations, SKU indexing, warehouse aisle assignment, and manual adjustment logs.
3. **Module 3 – Vendor & Supplier Management:** Contact directories, delivery lead-time tracking, and quality score rating.
4. **Module 4 – Customer Order Processing:** Multi-item cart building, customer shipping details, payment flags, and transactional order status transitions.
5. **Module 5 – Logistics & Shipment Tracking:** Waypoint checkpoint updates, carrier assignment (BlueDart, FedEx, DHL), and public tracking lookup.
6. **Module 6 – Safety Alert Engine:** Automated identification of under-stocked items with one-click rapid replenishment actions.

---

### 7. Expected Outcomes
- A fully responsive web interface accessible across desktop, tablet, and mobile browsers.
- Sub-second API response latencies powered by FastAPI's asynchronous architecture.
- 100% test coverage across core business workflows including stock deductions and order processing.
- One-command deployment via `docker compose up --build`.
