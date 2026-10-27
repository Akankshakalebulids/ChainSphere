# SmartChain – Architecture & Database Design

---

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Client_Tier ["Client Tier (Browser / UI)"]
        UI["React 18 Single Page Application (SPA)"]
        Vite["Vite Build Tool & Dev Server (Port 3000)"]
        UI --- Vite
    end

    subgraph API_Gateway ["Application Tier (FastAPI Service)"]
        FastAPI["FastAPI REST API Engine (Port 8000)"]
        CORS["CORS & Request Middleware"]
        Router["API Routers (/products, /suppliers, /orders, /shipments, /dashboard)"]
        Pydantic["Pydantic v2 Schema Validation"]
        CRUD["Business Logic & Transaction Controllers"]
        
        FastAPI --> CORS
        CORS --> Router
        Router --> Pydantic
        Pydantic --> CRUD
    end

    subgraph Data_Tier ["Persistence Tier (Database & Storage)"]
        ORM["SQLAlchemy 2.0 ORM Engine"]
        MySQL[("MySQL 8.0 Database (Port 3306)")]
        SQLite[("Offline Development SQLite Fallback")]
        InitSQL["init.sql Seeder & DDL Schema"]
        
        CRUD --> ORM
        ORM -->|Primary Docker / Local| MySQL
        ORM -.->|Automatic Offline Fallback| SQLite
        InitSQL --> MySQL
    end

    subgraph Containerization ["Containerization & Infrastructure"]
        DockerCompose["Docker Compose (compose.yaml)"]
        Net["smartchain_network (Bridge)"]
        Vol[("smartchain_mysql_data Volume")]
        
        DockerCompose --> Net
        DockerCompose --> Vol
    end

    UI -->|HTTP / JSON REST API| FastAPI
```

---

## 2. Data Flow Diagram (DFD)

### Level 0: Context Diagram
```mermaid
flowchart LR
    Customer["Customer / User"] -->|Place Orders & Track Shipments| SCM["SmartChain SCM System"]
    Manager["Warehouse / SCM Manager"] -->|Manage Products, Stock, Suppliers| SCM
    SCM -->|Live Alerts, Order Invoices, Waypoint Updates| Customer
    SCM -->|KPI Metrics, Low-Stock Reports, Analytics| Manager
    SCM <-->|Persist Records| DB[("MySQL Database")]
```

### Level 1: Functional DFD
```mermaid
flowchart TD
    User["Warehouse Operator / Admin"]
    
    subgraph SCM_Core ["SmartChain Core Processing"]
        P1["1.0 Catalog Management"]
        P2["2.0 Safety Alert Engine"]
        P3["3.0 Order Fulfillment Engine"]
        P4["4.0 Logistics Tracking Engine"]
        P5["5.0 Executive Analytics"]
    end

    DB1[("Suppliers Table")]
    DB2[("Products Table")]
    DB3[("Orders Table")]
    DB4[("Order Items Table")]
    DB5[("Shipments Table")]

    User -->|Product & Stock Entry| P1
    P1 -->|Store / Update| DB2
    P1 -->|Link Vendor| DB1

    DB2 -->|Read Stock & Threshold| P2
    P2 -->|Generate Alert Badges| User

    User -->|Submit Order| P3
    P3 -->|Validate Stock| DB2
    P3 -->|Deduct Inventory| DB2
    P3 -->|Create Order Record| DB3
    P3 -->|Create Order Items| DB4

    P3 -->|Trigger Shipment Request| P4
    P4 -->|Create Tracking Number| DB5
    P4 -->|Update Waypoint Status| DB5
    DB5 -->|Auto-Update Order Status| DB3

    DB2 & DB3 & DB5 -->|Aggregate Records| P5
    P5 -->|Render KPI Dashboard| User
```

---

## 3. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    SUPPLIERS ||--o{ PRODUCTS : "supplies"
    PRODUCTS ||--o{ ORDER_ITEMS : "included_in"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    ORDERS ||--o| SHIPMENTS : "dispatched_via"

    SUPPLIERS {
        int id PK
        string name
        string contact_person
        string email UK
        string phone
        string address
        string city
        string country
        int lead_time_days
        float rating
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        int id PK
        string sku UK
        string name
        string category
        text description
        float unit_price
        float cost_price
        int quantity_in_stock
        int reorder_threshold
        string warehouse_location
        int supplier_id FK
        datetime created_at
        datetime updated_at
    }

    ORDERS {
        int id PK
        string order_number UK
        string customer_name
        string customer_email
        string customer_phone
        text shipping_address
        float total_amount
        string status
        string payment_status
        datetime order_date
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        float unit_price
        float subtotal
    }

    SHIPMENTS {
        int id PK
        string tracking_number UK
        int order_id FK,UK
        string carrier
        string origin
        string destination
        string current_location
        string status
        datetime estimated_delivery
        datetime dispatched_at
        datetime delivered_at
        text notes
        datetime updated_at
    }
```

---

## 4. Database Data Dictionary

### Table 1: `suppliers`
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for supplier |
| `name` | VARCHAR(150) | NOT NULL, INDEX | Supplier / vendor business name |
| `contact_person` | VARCHAR(100) | NULLABLE | Primary representative |
| `email` | VARCHAR(120) | NOT NULL, UNIQUE, INDEX | Official corporate email address |
| `phone` | VARCHAR(30) | NULLABLE | Direct contact phone number |
| `address` | VARCHAR(255) | NULLABLE | Street or industrial estate address |
| `city` | VARCHAR(100) | NULLABLE | Operating city |
| `country` | VARCHAR(100) | DEFAULT 'India' | Country of operation |
| `lead_time_days` | INT | DEFAULT 7 | Average fulfillment lead time in days |
| `rating` | FLOAT | DEFAULT 4.5 | Reliability score (1.0 to 5.0) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Operational active flag |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last modification timestamp |

### Table 2: `products`
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique catalog product ID |
| `sku` | VARCHAR(50) | NOT NULL, UNIQUE, INDEX | Unique Stock Keeping Unit code |
| `name` | VARCHAR(150) | NOT NULL, INDEX | Product commercial name |
| `category` | VARCHAR(100) | NOT NULL, INDEX | Classification (Electronics, Hardware, etc.) |
| `description` | TEXT | NULLABLE | Technical or physical description |
| `unit_price` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Selling price per unit (INR) |
| `cost_price` | DECIMAL(10,2) | DEFAULT 0.00 | Procurement cost price per unit |
| `quantity_in_stock` | INT | NOT NULL, DEFAULT 0 | Real-time physical inventory quantity |
| `reorder_threshold` | INT | NOT NULL, DEFAULT 10 | Minimum safety threshold for alerts |
| `warehouse_location`| VARCHAR(50) | DEFAULT 'Aisle 1' | Bin / Rack / Aisle physical location |
| `supplier_id` | INT | NULLABLE, FOREIGN KEY (`suppliers.id`) | Primary vendor link |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last inventory/price update |

### Table 3: `orders`
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Internal order record key |
| `order_number` | VARCHAR(50) | NOT NULL, UNIQUE, INDEX | Business order reference (`ORD-YYYYMMDD-XXXX`) |
| `customer_name` | VARCHAR(150) | NOT NULL | Customer or client company name |
| `customer_email` | VARCHAR(120) | NOT NULL | Customer contact email |
| `customer_phone` | VARCHAR(30) | NULLABLE | Customer phone number |
| `shipping_address`| TEXT | NOT NULL | Delivery destination address |
| `total_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0.00 | Total invoiced order amount (INR) |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'Pending' | Pending, Processing, Shipped, Delivered, Cancelled |
| `payment_status` | VARCHAR(50) | DEFAULT 'Paid' | Paid, Pending, Refunded |
| `order_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Order submission datetime |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last status modification timestamp |

### Table 4: `order_items`
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Primary line item ID |
| `order_id` | INT | NOT NULL, FOREIGN KEY (`orders.id`) ON DELETE CASCADE | Parent order link |
| `product_id` | INT | NOT NULL, FOREIGN KEY (`products.id`) | Catalog item link |
| `quantity` | INT | NOT NULL | Quantity ordered |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Frozen unit price at time of purchase |
| `subtotal` | DECIMAL(12,2) | NOT NULL | Computed line total (`quantity * unit_price`) |

### Table 5: `shipments`
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique shipment record ID |
| `tracking_number` | VARCHAR(60) | NOT NULL, UNIQUE, INDEX | Public tracking code (`TRK-SC-XXXXXX`) |
| `order_id` | INT | NOT NULL, UNIQUE, FOREIGN KEY (`orders.id`) | 1-to-1 link with order |
| `carrier` | VARCHAR(80) | NOT NULL | BlueDart, FedEx, DHL, etc. |
| `origin` | VARCHAR(150) | NOT NULL | Dispatch warehouse hub |
| `destination` | VARCHAR(255) | NOT NULL | Delivery target destination |
| `current_location`| VARCHAR(150) | NOT NULL | Current waypoint checkpoint |
| `status` | VARCHAR(50) | DEFAULT 'In Transit' | In Transit, Out for Delivery, Delivered, Delayed |
| `estimated_delivery`| TIMESTAMP | NULLABLE | Anticipated delivery timestamp |
| `dispatched_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Departure timestamp |
| `delivered_at` | TIMESTAMP | NULLABLE | Verified receipt timestamp |
| `notes` | TEXT | NULLABLE | Transit remarks or driver observations |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last tracking status change |
