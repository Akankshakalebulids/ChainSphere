# SmartChain – Viva Voce Examination Questions & Answers
## Comprehensive 35-Question Q&A Guide for Project Evaluation

---

### Category 1: Project Overview & Supply Chain Logic

#### Q1: What is the main objective of the SmartChain project?
**Answer:** SmartChain is an integrated full-stack Supply Chain Management system designed to provide end-to-end visibility across inventory cataloging, supplier relationships, customer order fulfillment with atomic stock deduction, live shipment waypoint tracking, and automated safety stock alerts.

#### Q2: What is a "Safety Stock" or "Reorder Threshold" and how does SmartChain handle it?
**Answer:** A safety stock threshold is a predefined minimum quantity of an item that must be kept in the warehouse to prevent stockouts caused by demand spikes or delivery delays. In SmartChain, each product has a `reorder_threshold`. The system continuously evaluates `quantity_in_stock <= reorder_threshold`, triggers red/amber alert badges on the dashboard, and automatically calculates suggested replenishment quantities: `(Threshold * 2) - Current Stock`.

#### Q3: What happens to inventory when an order is placed or cancelled?
**Answer:** When an order is placed, the backend checks inventory availability. If stock is sufficient, it immediately and atomically decrements `quantity_in_stock` inside a database transaction. If the order is later cancelled (`status = 'Cancelled'`), the system automatically replenishes the product stock by the exact quantities in that order, maintaining database and warehouse parity.

#### Q4: Why is SKU (Stock Keeping Unit) uniqueness important in supply chain systems?
**Answer:** An SKU is a scannable barcoded alphanumeric identifier assigned to each product variant. Uniqueness is essential to avoid inventory collisions, mis-picks during warehouse dispatch, and erroneous order allocations. SmartChain enforces unique constraints on SKUs at both database and API validation levels.

#### Q5: How does the tracking module link orders to shipments?
**Answer:** The `shipments` table maintains a 1-to-1 foreign key relationship (`order_id`) with the `orders` table. When a shipment is dispatched, a unique tracking number (`TRK-SC-XXXXXX`) is generated, and the parent order's status automatically transitions to `Shipped`. When marked as `Delivered`, the parent order is automatically updated to `Delivered`.

---

### Category 2: Backend Architecture & Python FastAPI

#### Q6: Why did you choose FastAPI over Flask or Django?
**Answer:** 
1. **Asynchronous Performance:** FastAPI is built on Starlette and ASGI (`async`/`await`), offering performance comparable to Node.js and Go.
2. **Automatic Data Validation:** Deep integration with Pydantic v2 ensures strict request/response data typing and input validation.
3. **Automatic Documentation:** FastAPI automatically generates interactive OpenAPI/Swagger (`/docs`) and ReDoc (`/redoc`) specifications.
4. **Lightweight & Modular:** Unlike Django, which is an opinionated monolithic framework with its own ORM, FastAPI allows flexible pairing with SQLAlchemy 2.0.

#### Q7: What is Pydantic and how is it used in your project?
**Answer:** Pydantic is a data validation and parsing library using standard Python type annotations. In SmartChain, Pydantic schemas (`SupplierCreate`, `ProductCreate`, `OrderCreate`, etc.) validate inbound JSON payloads, enforce data boundaries (e.g., non-negative prices, valid email formatting), and filter sensitive fields in response models.

#### Q8: What is SQLAlchemy and how does session management work?
**Answer:** SQLAlchemy is an Object Relational Mapper (ORM) that translates Python model classes into SQL relational tables and queries. SmartChain uses `sessionmaker` and FastAPI's dependency injection (`Depends(get_db)`), creating a dedicated session per incoming HTTP request that automatically commits or rolls back and closes in a `finally` block to prevent database connection leaks.

#### Q9: How did you implement CORS in FastAPI and why is it necessary?
**Answer:** Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts a web application running on one origin (e.g., React on `http://localhost:3000`) from making requests to a different origin (e.g., FastAPI on `http://localhost:8000`). We added FastAPI's `CORSMiddleware` configured with allowed origins, methods (`*`), and headers (`*`).

#### Q10: How does the backend handle database failover between MySQL and SQLite?
**Answer:** In `database.py`, the engine initialization tries to connect to the primary MySQL connection string (`settings.DATABASE_URL`). If the MySQL server is unreachable (for example, on an examiner's machine without Docker or MySQL active), it catches the exception and falls back to a local SQLite database (`sqlite:///./smartchain.db`) with automatic table creation and data seeding.

#### Q11: How do you prevent race conditions during concurrent order placements?
**Answer:** During order creation, the query for the target product applies `with_for_update()` in MySQL (pessimistic locking) within a database transaction. This locks the selected row until the transaction commits, ensuring that two concurrent buyers cannot purchase the same last unit of stock simultaneously.

#### Q12: What HTTP status codes are used across your REST API endpoints?
**Answer:**
- `200 OK`: Successful retrieval or update.
- `201 Created`: Resource successfully created (new product, order, supplier, or shipment).
- `400 Bad Request`: Business rule violation (duplicate SKU, insufficient inventory, email already taken).
- `404 Not Found`: Target resource ID does not exist.
- `422 Unprocessable Entity`: Request body failed Pydantic schema validation.

---

### Category 3: Database & MySQL

#### Q13: Explain the database normalization of SmartChain.
**Answer:** The database schema is normalized up to Third Normal Form (3NF):
- **1NF:** All fields contain atomic values; no multi-valued attributes.
- **2NF:** All non-key attributes are fully functionally dependent on the primary key (order items are separated into a dedicated `order_items` table rather than stored as serialized arrays in `orders`).
- **3NF:** No transitive dependencies exist. For example, product category and unit price depend strictly on `product_id`, not on `order_id`.

#### Q14: Explain the difference between `CASCADE` and `SET NULL` on foreign key deletions in your schema.
**Answer:**
- In `order_items`, the foreign key `order_id` has `ON DELETE CASCADE`: if an order is deleted, all its individual line items are automatically deleted.
- In `products`, the foreign key `supplier_id` has `ON DELETE SET NULL`: if a supplier company is removed from the directory, the product catalog entries remain intact, but their `supplier_id` becomes NULL.

#### Q15: What are ACID properties and how are they maintained in SmartChain?
**Answer:**
- **Atomicity:** When placing an order, either the order record, line items, and stock deductions all succeed together, or if any item has insufficient stock, the entire transaction rolls back.
- **Consistency:** Foreign key constraints and column types ensure the database transitions only between valid states.
- **Isolation:** Transaction isolation prevents dirty reads during stock updates.
- **Durability:** Committed transactions are written to disk/volume storage.

#### Q16: Why did you create indexes on `sku`, `name`, `email`, and `tracking_number`?
**Answer:** Indexes use B-Tree data structures to dramatically speed up lookups from $O(N)$ linear scans to $O(\log N)$ logarithmic searches for frequently queried unique and search fields.

---

### Category 4: Frontend Architecture & React

#### Q17: What is a Single Page Application (SPA)?
**Answer:** A web application that loads a single HTML document and dynamically updates the page content as the user interacts with the application via JavaScript (Virtual DOM) without reloading the entire page from the server.

#### Q18: What are React hooks and which ones did you use?
**Answer:** React hooks are functions that let functional components manage state and lifecycle features:
- `useState`: Manages local component state (e.g., active tab, form inputs, modal visibility).
- `useEffect`: Triggers side effects like fetching data from REST APIs on mount or when dependencies change.

#### Q19: How does the frontend communicate with the backend?
**Answer:** Through an asynchronous API service module (`src/services/api.js`) utilizing the modern browser `fetch` API. In development, Vite's proxy forwards `/api` requests to `http://localhost:8000`, eliminating CORS issues during development.

#### Q20: How is state shared between the dashboard, alerts, and sidebar badge?
**Answer:** The root `App.jsx` component maintains global state for the active tab, low stock count, and system health status. When inventory changes occur in the alerts or products tabs, a callback notifies `App.jsx` to refresh global counters and update the sidebar badge in real-time.

---

### Category 5: Docker & Containerization

#### Q21: What is the difference between a Docker Image and a Docker Container?
**Answer:** A Docker image is a read-only blueprint/template containing the application code, runtime libraries, and environment configuration. A Docker container is a runnable, isolated instance of an image executed in an isolated process space.

#### Q22: Why did you use multi-stage builds in the frontend Dockerfile?
**Answer:** Multi-stage builds separate the build environment from the production runtime. Stage 1 uses a heavy Node.js image with npm to compile the React JSX code into static HTML/CSS/JS. Stage 2 copies only the compiled `dist/` directory into a lightweight Alpine Nginx image (~20MB), reducing image size, memory consumption, and potential security attack surface.

#### Q23: What is the purpose of `compose.yaml`?
**Answer:** Docker Compose is a declarative tool for defining and running multi-container Docker applications. With a single file, it orchestrates the `db` (MySQL), `backend` (FastAPI), and `frontend` (React/Nginx) services, bridges their internal network, maps external host ports, provisions persistent storage volumes, and enforces health checks.

#### Q24: What is a Docker Healthcheck and why is it used for MySQL?
**Answer:** When starting multi-container applications, the MySQL container may report as "running" before the MySQL daemon has finished initializing. The `healthcheck` executes `mysqladmin ping` every 5 seconds. The backend service has `depends_on: { db: { condition: service_healthy } }`, guaranteeing that FastAPI will only start once MySQL is ready to accept queries.

---

### Category 6: Jira & Agile Project Management

#### Q25: What is Scrum and what is a Sprint?
**Answer:** Scrum is an iterative Agile project management framework for delivering working software increments. A Sprint is a fixed-duration timebox (2 weeks in SmartChain) during which the development team completes a committed set of user stories selected from the product backlog.

#### Q26: What is a Jira Epic and how does it relate to User Stories?
**Answer:** An Epic is a large body of work that can be broken down into multiple smaller user stories. For example, `SCM-EPIC-1: Product & Inventory Master` contains stories like `SCM-101: Create and Catalog Products` and `SCM-102: Search and Filter Catalog`.

#### Q27: What is a Story Point and why is Fibonacci sequence used for estimation?
**Answer:** A story point is a metric that estimates the relative effort, complexity, and risk required to implement a user story. The Fibonacci sequence (1, 2, 3, 5, 8, 13...) is used because as uncertainty increases, the gaps between numbers grow larger, discouraging false precision and encouraging meaningful consensus during sprint planning.

#### Q28: What is a Burndown Chart and Velocity in Agile?
**Answer:**
- **Sprint Burndown Chart:** A visual graph showing the remaining story points over the days of a sprint. It helps teams monitor whether they are on track to complete their sprint commitment.
- **Velocity:** The average number of story points completed by a development team per sprint. It aids in forecasting future release timelines.

#### Q29: What is the "Definition of Done" (DoD)?
**Answer:** A formal checklist of agreed criteria that a user story must satisfy before it can be transitioned to the `Done` status. In SmartChain, this includes code completion, automated Pytest passage, Pydantic validation, and peer review.

---

### Category 7: Practical Demonstration Walkthrough

#### Q30: How would you demonstrate the core features of SmartChain to an examiner?
**Answer:**
1. **Show the Dashboard:** Point out the 6 real-time KPI tiles (Total Products, Valuation ₹, Active Orders, Revenue, Low Stock Alerts, Active Shipments).
2. **Demonstrate Low-Stock Alert:** Show how products below their reorder threshold appear on the Alerts tab with suggested replenishment quantities.
3. **Place a Customer Order:** Select products, enter customer details, and submit. Show that the product's inventory is immediately decremented.
4. **Try Ordering More Than In Stock:** Show the validation error message when requesting more units than available.
5. **Dispatch a Shipment:** Create a shipment for the new order, generate a tracking code (`TRK-SC-XXXXXX`), and watch the order status change to `Shipped`.
6. **Track the Shipment:** Enter the tracking code in the public tracking search bar to show live checkpoints, and then mark it as `Delivered`.
7. **Run Automated Tests:** Run `pytest backend/tests -v` in the terminal to demonstrate that all 10 automated test cases pass with 100% success.
