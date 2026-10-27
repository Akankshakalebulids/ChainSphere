-- =============================================================================
-- SmartChain: Supply Chain Management System
-- Database Schema & Initial Data Seeder (MySQL 8.0+)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smartchain_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartchain_db;

-- -----------------------------------------------------------------------------
-- 1. Table: suppliers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'India',
    lead_time_days INT DEFAULT 7,
    rating FLOAT DEFAULT 4.5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suppliers_name (name),
    INDEX idx_suppliers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. Table: products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reorder_threshold INT NOT NULL DEFAULT 10,
    warehouse_location VARCHAR(50) DEFAULT 'Aisle 1',
    supplier_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_products_sku (sku),
    INDEX idx_products_name (name),
    INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. Table: orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NULL,
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    payment_status VARCHAR(50) DEFAULT 'Paid',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4. Table: order_items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 5. Table: shipments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_number VARCHAR(60) NOT NULL UNIQUE,
    order_id INT NOT NULL UNIQUE,
    carrier VARCHAR(80) NOT NULL,
    origin VARCHAR(150) DEFAULT 'Central Distribution Hub, Bhiwandi',
    destination VARCHAR(255) NOT NULL,
    current_location VARCHAR(150) DEFAULT 'Origin Sorting Facility',
    status VARCHAR(50) DEFAULT 'In Transit',
    estimated_delivery TIMESTAMP NULL,
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    notes TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_shipments_tracking (tracking_number),
    INDEX idx_shipments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------------------------
INSERT INTO suppliers (id, name, contact_person, email, phone, address, city, country, lead_time_days, rating, is_active)
VALUES
(1, 'Apex Microchip & Silicon Ltd', 'Vikram Singhania', 'vikram@apexsilicon.com', '+91 9820011223', 'Plot 55, Electronic City Phase 1', 'Bengaluru', 'India', 5, 4.9, TRUE),
(2, 'Nova Packaging & Containers', 'Priya Deshmukh', 'priya.d@novapack.in', '+91 9819922334', 'Gala 12, TTC Industrial Area', 'Navi Mumbai', 'India', 3, 4.7, TRUE),
(3, 'Zenith Power Systems', 'Amitabh Roy', 'aroy@zenithpower.co.in', '+91 9845033445', 'Sector 18, Udyog Vihar', 'Gurugram', 'India', 7, 4.6, TRUE),
(4, 'Omni Precision Sensors', 'Sneha Kulkarni', 'sneha@omnisensors.com', '+91 9765444556', 'Bhosari MIDC, Pimpri', 'Pune', 'India', 4, 4.8, TRUE),
(5, 'Global Freight & Fasteners Corp', 'Manoj Chawla', 'm.chawla@globalfasteners.net', '+91 9898055667', 'GIDC Estate, Vatva', 'Ahmedabad', 'India', 6, 4.3, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO products (id, sku, name, category, description, unit_price, cost_price, quantity_in_stock, reorder_threshold, warehouse_location, supplier_id)
VALUES
(1, 'PRD-ELEC-101', 'ESP32-S3 Dual Core IoT Module', 'Electronics', 'Ultra-low power WiFi & Bluetooth 5.0 SoC microcontroller module', 450.00, 280.00, 120, 25, 'Rack A-01, Shelf 2', 1),
(2, 'PRD-ELEC-102', 'ARM Cortex M4 Development Board', 'Electronics', '32-bit MCU evaluation board with ST-LINK on-board debugger', 1250.00, 820.00, 8, 15, 'Rack A-02, Shelf 1', 1),
(3, 'PRD-POW-201', 'LiFePO4 12V 20Ah Battery Pack', 'Power Systems', 'High cycle life deep-cycle lithium iron phosphate battery', 5800.00, 4100.00, 35, 10, 'Rack B-04, Zone Heavy', 3),
(4, 'PRD-POW-202', 'Switch Mode Power Supply 24V 10A', 'Power Systems', 'Industrial DIN rail mount enclosed power converter unit', 1650.00, 1100.00, 5, 12, 'Rack B-01, Shelf 3', 3),
(5, 'PRD-SENS-301', 'Optical Time-of-Flight LiDAR Sensor', 'Sensors', 'High precision 12-meter ranging distance measurement module', 1890.00, 1250.00, 42, 10, 'Rack C-02, Cabinet 4', 4),
(6, 'PRD-SENS-302', 'Industrial RTD PT100 Temperature Probe', 'Sensors', 'Stainless steel waterproof resistance thermometer probe', 780.00, 490.00, 4, 10, 'Rack C-03, Cabinet 1', 4),
(7, 'PRD-PACK-401', 'Anti-Static ESD Shielding Bags (100-pack)', 'Packaging', 'Moisture barrier static conductive packing pouches 15x20cm', 350.00, 190.00, 85, 20, 'Rack D-01, Bin 12', 2),
(8, 'PRD-PACK-402', 'Corrugated Shipping Boxes 12x10x8 inch (50-pack)', 'Packaging', 'Heavy-duty 5-ply cardboard packaging dispatch cartons', 890.00, 550.00, 60, 25, 'Rack D-03, Pallet 2', 2),
(9, 'PRD-MECH-501', 'M3 High Tensile Hex Bolts & Nuts (Box of 500)', 'Hardware', 'Grade 8.8 zinc plated socket head cap fastener hardware', 420.00, 240.00, 150, 30, 'Rack E-01, Drawer 7', 5),
(10, 'PRD-MECH-502', 'Linear Motion Ball Bearing Carriage 15mm', 'Hardware', 'Precision CNC guideway sliding block with dustproof seals', 1150.00, 740.00, 22, 8, 'Rack E-02, Drawer 3', 5)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_status, order_date)
VALUES
(1, 'ORD-20261019-1001', 'TechMatrix Automations Pvt Ltd', 'procurement@techmatrix.co.in', '+91 9822334455', 'Unit 401, Cyber City Hub, Magarpatta, Pune 411028', 13300.00, 'Delivered', 'Paid', NOW() - INTERVAL 5 DAY),
(2, 'ORD-20261020-1002', 'RoboGenius Robotics Lab', 'lab@robogenius.edu', '+91 9766554433', 'Dept of Robotics, Kothrud Tech Campus, Pune 411038', 5670.00, 'Shipped', 'Paid', NOW() - INTERVAL 2 DAY),
(3, 'ORD-20261021-1003', 'Aarohi Electronics Store', 'contact@aarohielectronics.in', '+91 9988112233', '14 Station Road, Dadar West, Mumbai 400028', 4050.00, 'Processing', 'Paid', NOW() - INTERVAL 6 HOUR)
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal)
VALUES
(1, 1, 1, 10, 450.00, 4500.00),
(2, 1, 3, 1, 5800.00, 5800.00),
(3, 1, 6, 2, 1500.00, 3000.00),
(4, 2, 5, 3, 1890.00, 5670.00),
(5, 3, 1, 5, 450.00, 2250.00),
(6, 3, 7, 3, 350.00, 1050.00),
(7, 3, 9, 1, 420.00, 420.00)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

INSERT INTO shipments (id, tracking_number, order_id, carrier, origin, destination, current_location, status, estimated_delivery, dispatched_at, delivered_at, notes)
VALUES
(1, 'TRK-SC-98214A1', 1, 'BlueDart Express', 'Central Logistics Park, Bhiwandi', 'Magarpatta, Pune', 'Delivered at Destination Gate 2', 'Delivered', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 1 DAY, 'Package signed and received by Security Reception.'),
(2, 'TRK-SC-73491B2', 2, 'FedEx Ground Logistics', 'Central Logistics Park, Bhiwandi', 'Kothrud, Pune', 'Pune Hub Sort Center (In Transit)', 'In Transit', NOW() + INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, NULL, 'On schedule for delivery tomorrow before 5:00 PM.')
ON DUPLICATE KEY UPDATE status=VALUES(status);
