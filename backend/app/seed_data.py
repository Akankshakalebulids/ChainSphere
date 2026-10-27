import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Supplier, Product, Order, OrderItem, Shipment

logger = logging.getLogger("smartchain.seeder")

def seed_initial_data(db: Session):
    """Seed sample data if database tables are currently empty."""
    supplier_count = db.query(Supplier).count()
    if supplier_count > 0:
        logger.info("Database already contains data, skipping seed.")
        return

    logger.info("Seeding initial supply chain sample data...")

    # 1. Suppliers
    suppliers = [
        Supplier(
            name="Apex Microchip & Silicon Ltd",
            contact_person="Vikram Singhania",
            email="vikram@apexsilicon.com",
            phone="+91 9820011223",
            address="Plot 55, Electronic City Phase 1",
            city="Bengaluru",
            country="India",
            lead_time_days=5,
            rating=4.9,
            is_active=True
        ),
        Supplier(
            name="Nova Packaging & Containers",
            contact_person="Priya Deshmukh",
            email="priya.d@novapack.in",
            phone="+91 9819922334",
            address="Gala 12, TTC Industrial Area",
            city="Navi Mumbai",
            country="India",
            lead_time_days=3,
            rating=4.7,
            is_active=True
        ),
        Supplier(
            name="Zenith Power Systems",
            contact_person="Amitabh Roy",
            email="aroy@zenithpower.co.in",
            phone="+91 9845033445",
            address="Sector 18, Udyog Vihar",
            city="Gurugram",
            country="India",
            lead_time_days=7,
            rating=4.6,
            is_active=True
        ),
        Supplier(
            name="Omni Precision Sensors",
            contact_person="Sneha Kulkarni",
            email="sneha@omnisensors.com",
            phone="+91 9765444556",
            address="Bhosari MIDC, Pimpri",
            city="Pune",
            country="India",
            lead_time_days=4,
            rating=4.8,
            is_active=True
        ),
        Supplier(
            name="Global Freight & Fasteners Corp",
            contact_person="Manoj Chawla",
            email="m.chawla@globalfasteners.net",
            phone="+91 9898055667",
            address="GIDC Estate, Vatva",
            city="Ahmedabad",
            country="India",
            lead_time_days=6,
            rating=4.3,
            is_active=True
        )
    ]
    db.add_all(suppliers)
    db.flush()

    # 2. Products (including low stock products for alert testing)
    products = [
        Product(
            sku="PRD-ELEC-101",
            name="ESP32-S3 Dual Core IoT Module",
            category="Electronics",
            description="Ultra-low power WiFi & Bluetooth 5.0 SoC microcontroller module",
            unit_price=450.0,
            cost_price=280.0,
            quantity_in_stock=120,
            reorder_threshold=25,
            warehouse_location="Rack A-01, Shelf 2",
            supplier_id=suppliers[0].id
        ),
        Product(
            sku="PRD-ELEC-102",
            name="ARM Cortex M4 Development Board",
            category="Electronics",
            description="32-bit MCU evaluation board with ST-LINK on-board debugger",
            unit_price=1250.0,
            cost_price=820.0,
            quantity_in_stock=8,  # LOW STOCK (<= 15)
            reorder_threshold=15,
            warehouse_location="Rack A-02, Shelf 1",
            supplier_id=suppliers[0].id
        ),
        Product(
            sku="PRD-POW-201",
            name="LiFePO4 12V 20Ah Battery Pack",
            category="Power Systems",
            description="High cycle life deep-cycle lithium iron phosphate battery",
            unit_price=5800.0,
            cost_price=4100.0,
            quantity_in_stock=35,
            reorder_threshold=10,
            warehouse_location="Rack B-04, Zone Heavy",
            supplier_id=suppliers[2].id
        ),
        Product(
            sku="PRD-POW-202",
            name="Switch Mode Power Supply 24V 10A",
            category="Power Systems",
            description="Industrial DIN rail mount enclosed power converter unit",
            unit_price=1650.0,
            cost_price=1100.0,
            quantity_in_stock=5,  # CRITICAL LOW STOCK (<= 12)
            reorder_threshold=12,
            warehouse_location="Rack B-01, Shelf 3",
            supplier_id=suppliers[2].id
        ),
        Product(
            sku="PRD-SENS-301",
            name="Optical Time-of-Flight LiDAR Sensor",
            category="Sensors",
            description="High precision 12-meter ranging distance measurement module",
            unit_price=1890.0,
            cost_price=1250.0,
            quantity_in_stock=42,
            reorder_threshold=10,
            warehouse_location="Rack C-02, Cabinet 4",
            supplier_id=suppliers[3].id
        ),
        Product(
            sku="PRD-SENS-302",
            name="Industrial RTD PT100 Temperature Probe",
            category="Sensors",
            description="Stainless steel waterproof resistance thermometer probe",
            unit_price=780.0,
            cost_price=490.0,
            quantity_in_stock=4,  # CRITICAL LOW STOCK (<= 10)
            reorder_threshold=10,
            warehouse_location="Rack C-03, Cabinet 1",
            supplier_id=suppliers[3].id
        ),
        Product(
            sku="PRD-PACK-401",
            name="Anti-Static ESD Shielding Bags (100-pack)",
            category="Packaging",
            description="Moisture barrier static conductive packing pouches 15x20cm",
            unit_price=350.0,
            cost_price=190.0,
            quantity_in_stock=85,
            reorder_threshold=20,
            warehouse_location="Rack D-01, Bin 12",
            supplier_id=suppliers[1].id
        ),
        Product(
            sku="PRD-PACK-402",
            name="Corrugated Shipping Boxes 12x10x8 inch (50-pack)",
            category="Packaging",
            description="Heavy-duty 5-ply cardboard packaging dispatch cartons",
            unit_price=890.0,
            cost_price=550.0,
            quantity_in_stock=60,
            reorder_threshold=25,
            warehouse_location="Rack D-03, Pallet 2",
            supplier_id=suppliers[1].id
        ),
        Product(
            sku="PRD-MECH-501",
            name="M3 High Tensile Hex Bolts & Nuts (Box of 500)",
            category="Hardware",
            description="Grade 8.8 zinc plated socket head cap fastener hardware",
            unit_price=420.0,
            cost_price=240.0,
            quantity_in_stock=150,
            reorder_threshold=30,
            warehouse_location="Rack E-01, Drawer 7",
            supplier_id=suppliers[4].id
        ),
        Product(
            sku="PRD-MECH-502",
            name="Linear Motion Ball Bearing Carriage 15mm",
            category="Hardware",
            description="Precision CNC guideway sliding block with dustproof seals",
            unit_price=1150.0,
            cost_price=740.0,
            quantity_in_stock=22,
            reorder_threshold=8,
            warehouse_location="Rack E-02, Drawer 3",
            supplier_id=suppliers[4].id
        )
    ]
    db.add_all(products)
    db.flush()

    # 3. Customer Orders
    order_1 = Order(
        order_number="ORD-20261019-1001",
        customer_name="TechMatrix Automations Pvt Ltd",
        customer_email="procurement@techmatrix.co.in",
        customer_phone="+91 9822334455",
        shipping_address="Unit 401, Cyber City Hub, Magarpatta, Pune 411028",
        total_amount=13300.0,
        status="Delivered",
        payment_status="Paid",
        order_date=datetime.utcnow() - timedelta(days=5),
        created_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(order_1)
    db.flush()

    order_1_items = [
        OrderItem(order_id=order_1.id, product_id=products[0].id, quantity=10, unit_price=450.0, subtotal=4500.0),
        OrderItem(order_id=order_1.id, product_id=products[2].id, quantity=1, unit_price=5800.0, subtotal=5800.0),
        OrderItem(order_id=order_1.id, product_id=products[5].id, quantity=2, unit_price=1500.0, subtotal=3000.0)
    ]
    db.add_all(order_1_items)

    order_2 = Order(
        order_number="ORD-20261020-1002",
        customer_name="RoboGenius Robotics Lab",
        customer_email="lab@robogenius.edu",
        customer_phone="+91 9766554433",
        shipping_address="Dept of Robotics, Kothrud Tech Campus, Pune 411038",
        total_amount=5670.0,
        status="Shipped",
        payment_status="Paid",
        order_date=datetime.utcnow() - timedelta(days=2),
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(order_2)
    db.flush()

    order_2_items = [
        OrderItem(order_id=order_2.id, product_id=products[4].id, quantity=3, unit_price=1890.0, subtotal=5670.0)
    ]
    db.add_all(order_2_items)

    order_3 = Order(
        order_number="ORD-20261021-1003",
        customer_name="Aarohi Electronics Store",
        customer_email="contact@aarohielectronics.in",
        customer_phone="+91 9988112233",
        shipping_address="14 Station Road, Dadar West, Mumbai 400028",
        total_amount=4050.0,
        status="Processing",
        payment_status="Paid",
        order_date=datetime.utcnow() - timedelta(hours=6),
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    db.add(order_3)
    db.flush()

    order_3_items = [
        OrderItem(order_id=order_3.id, product_id=products[0].id, quantity=5, unit_price=450.0, subtotal=2250.0),
        OrderItem(order_id=order_3.id, product_id=products[6].id, quantity=3, unit_price=350.0, subtotal=1050.0),
        OrderItem(order_id=order_3.id, product_id=products[8].id, quantity=1, unit_price=420.0, subtotal=420.0)
    ]
    db.add_all(order_3_items)

    # 4. Shipments
    shipment_1 = Shipment(
        tracking_number="TRK-SC-98214A1",
        order_id=order_1.id,
        carrier="BlueDart Express",
        origin="Central Logistics Park, Bhiwandi",
        destination="Magarpatta, Pune",
        current_location="Delivered at Destination Gate 2",
        status="Delivered",
        estimated_delivery=datetime.utcnow() - timedelta(days=1),
        dispatched_at=datetime.utcnow() - timedelta(days=4),
        delivered_at=datetime.utcnow() - timedelta(days=1),
        notes="Package signed and received by Security Reception."
    )
    db.add(shipment_1)

    shipment_2 = Shipment(
        tracking_number="TRK-SC-73491B2",
        order_id=order_2.id,
        carrier="FedEx Ground Logistics",
        origin="Central Logistics Park, Bhiwandi",
        destination="Kothrud, Pune",
        current_location="Pune Hub Sort Center (In Transit)",
        status="In Transit",
        estimated_delivery=datetime.utcnow() + timedelta(days=1),
        dispatched_at=datetime.utcnow() - timedelta(days=1),
        notes="On schedule for delivery tomorrow before 5:00 PM."
    )
    db.add(shipment_2)

    db.commit()
    logger.info("Database successfully seeded with realistic sample data!")
