-- ============================================================
-- Script 03: Seed Data
-- Hotel Management System - SQL Server
-- Run this in SSMS after 02-create-tables.sql
-- Inserts sample data matching the frontend mock data
-- ============================================================

USE [HotelManagementDB];
GO

-- ============================================================
-- 1. Users (5 staff members)
-- Passwords use SHA-256 hashes. Default password for all users: "hotel123"
-- SHA-256 of "hotel123" = 0aa6aa6a97fc2ccb4000f87bd9e93a2125582ff044a106c3418d95c04fbc7cae
-- ============================================================
SET IDENTITY_INSERT [hotel].[Users] ON;

INSERT INTO [hotel].[Users] (userId, username, passwordHash, role, isActive, createdAt)
VALUES
    (1, 'ana.martinez',    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrator',  1, '2025-01-15 09:00:00'),
    (2, 'carlos.ruiz',     '5d37ed314cf2b5c8462b52b12cd512e2ac4a180e75598da4f12bfb0dea6d0a67', 'Receptionist',   1, '2025-02-01 09:00:00'),
    (3, 'laura.gomez',     '5d37ed314cf2b5c8462b52b12cd512e2ac4a180e75598da4f12bfb0dea6d0a67', 'Receptionist',   1, '2025-02-10 09:00:00'),
    (4, 'pedro.sanchez',   '13a93f9a5502e71eed80a806f87bc4424e03e6b0d90acd513ea9d561c853b738', 'Operational',    1, '2025-03-01 09:00:00'),
    (5, 'isabel.torres',   '13a93f9a5502e71eed80a806f87bc4424e03e6b0d90acd513ea9d561c853b738', 'Operational',    0, '2025-03-15 09:00:00');

SET IDENTITY_INSERT [hotel].[Users] OFF;
GO

PRINT 'Inserted 5 users.';
GO

-- ============================================================
-- 2. Customers (5 guests)
-- ============================================================
SET IDENTITY_INSERT [hotel].[Customers] ON;

INSERT INTO [hotel].[Customers] (customerId, fullName, phone, email, idCardNo)
VALUES
    (1, 'Maria Garcia',    '+34 612 345 678',    'maria@email.com',       '12345678A'),
    (2, 'James Wilson',    '+44 7700 900000',    'james.w@email.com',     'AB123456'),
    (3, 'Sophie Laurent',  '+33 6 12 34 56 78',  'sophie.l@email.com',    'FR9876543'),
    (4, 'Marco Rossi',     '+39 333 1234567',    'marco.r@email.com',     'IT4567890'),
    (5, 'Yuki Tanaka',     '+81 90 1234 5678',   'yuki.t@email.com',      'JP2345678');

SET IDENTITY_INSERT [hotel].[Customers] OFF;
GO

PRINT 'Inserted 5 customers.';
GO

-- ============================================================
-- 3. Rooms (10 rooms)
-- ============================================================
SET IDENTITY_INSERT [hotel].[Rooms] ON;

INSERT INTO [hotel].[Rooms] (roomId, roomNumber, type, floor, pricePerNight, capacity, status)
VALUES
    (1,  '101', 'Single', 1,  85.00,  1, 'Available'),
    (2,  '102', 'Single', 1,  85.00,  1, 'Occupied'),
    (3,  '103', 'Double', 1, 130.00,  2, 'Cleaning'),
    (4,  '201', 'Double', 2, 130.00,  2, 'Available'),
    (5,  '202', 'Suite',  2, 250.00,  3, 'Occupied'),
    (6,  '203', 'Deluxe', 2, 350.00,  2, 'Available'),
    (7,  '301', 'Suite',  3, 250.00,  3, 'Maintenance'),
    (8,  '302', 'Deluxe', 3, 350.00,  2, 'Available'),
    (9,  '303', 'Single', 3,  95.00,  1, 'Occupied'),
    (10, '304', 'Double', 3, 140.00,  2, 'Available');

SET IDENTITY_INSERT [hotel].[Rooms] OFF;
GO

PRINT 'Inserted 10 rooms.';
GO

-- ============================================================
-- 4. Tables (8 restaurant tables)
-- ============================================================
SET IDENTITY_INSERT [hotel].[Tables] ON;

INSERT INTO [hotel].[Tables] (tableId, tableNumber, capacity, location, status)
VALUES
    (1, 'T1', 2, 'Indoor',   'Available'),
    (2, 'T2', 4, 'Indoor',   'Reserved'),
    (3, 'T3', 6, 'Indoor',   'Occupied'),
    (4, 'T4', 2, 'Terrace',  'Available'),
    (5, 'T5', 4, 'Terrace',  'Reserved'),
    (6, 'T6', 8, 'Private',  'Available'),
    (7, 'T7', 4, 'Indoor',   'Available'),
    (8, 'T8', 6, 'Terrace',  'Occupied');

SET IDENTITY_INSERT [hotel].[Tables] OFF;
GO

PRINT 'Inserted 8 restaurant tables.';
GO

-- ============================================================
-- 5. Services (8 available services)
-- ============================================================
SET IDENTITY_INSERT [hotel].[Services] ON;

INSERT INTO [hotel].[Services] (serviceId, name, unitPrice, category)
VALUES
    (1, 'Room Service Breakfast',  25.00, 'Food & Beverage'),
    (2, 'Room Service Dinner',     55.00, 'Food & Beverage'),
    (3, 'Mini Bar',                45.00, 'Food & Beverage'),
    (4, 'Spa Treatment',           80.00, 'Wellness'),
    (5, 'Laundry Service',         30.00, 'Housekeeping'),
    (6, 'Airport Transfer',        60.00, 'Transport'),
    (7, 'Late Check-out',          40.00, 'Accommodation'),
    (8, 'Extra Bed',               35.00, 'Accommodation');

SET IDENTITY_INSERT [hotel].[Services] OFF;
GO

PRINT 'Inserted 8 services.';
GO

-- ============================================================
-- 6. Inventory Items (10 items)
-- ============================================================
SET IDENTITY_INSERT [hotel].[InventoryItems] ON;

INSERT INTO [hotel].[InventoryItems] (itemId, name, unit, category, quantityOnHand, minThreshold)
VALUES
    (1,  'Bath Towels',      'pieces',  'Linens',      120,  50),
    (2,  'Bed Sheets (King)','sets',    'Linens',       35,  30),
    (3,  'Shampoo Bottles',  'bottles', 'Toiletries',  200, 100),
    (4,  'Soap Bars',        'pieces',  'Toiletries',   80, 100),
    (5,  'Coffee Packets',   'packets', 'Food',        300, 150),
    (6,  'Bottled Water',    'bottles', 'Beverages',    45, 200),
    (7,  'Floor Cleaner',    'liters',  'Cleaning',     25,  10),
    (8,  'Pillow Cases',     'pieces',  'Linens',       60,  40),
    (9,  'Tea Bags',         'bags',    'Food',        500, 200),
    (10, 'Hand Sanitizer',   'bottles', 'Toiletries',   15,  30);

SET IDENTITY_INSERT [hotel].[InventoryItems] OFF;
GO

PRINT 'Inserted 10 inventory items.';
GO

-- ============================================================
-- 7. Reservations (7 reservations)
-- ============================================================
SET IDENTITY_INSERT [hotel].[Reservations] ON;

INSERT INTO [hotel].[Reservations] (reservationId, customerId, roomId, tableId, startDate, endDate, reservationType, status, createdBy, createdAt)
VALUES
    -- res-001: Maria Garcia, Room 102, checked in
    (1, 1, 2,    NULL, '2026-02-20', '2026-02-24', 'Room',  'CheckedIn',  2, '2026-02-15 10:30:00'),
    -- res-002: James Wilson, Room 202 (Suite), checked in
    (2, 2, 5,    NULL, '2026-02-21', '2026-02-25', 'Room',  'CheckedIn',  2, '2026-02-18 14:00:00'),
    -- res-003: Sophie Laurent, Table T2, confirmed
    (3, 3, NULL, 2,    '2026-02-22', '2026-02-22', 'Table', 'Confirmed',  3, '2026-02-20 16:45:00'),
    -- res-004: Marco Rossi, Room 303, checked in
    (4, 4, 9,    NULL, '2026-02-19', '2026-02-22', 'Room',  'CheckedIn',  3, '2026-02-14 11:15:00'),
    -- res-005: Yuki Tanaka, Table T5, confirmed
    (5, 5, NULL, 5,    '2026-02-22', '2026-02-22', 'Table', 'Confirmed',  2, '2026-02-21 09:00:00'),
    -- res-006: Maria Garcia, Room 201, confirmed (future)
    (6, 1, 4,    NULL, '2026-02-26', '2026-02-28', 'Room',  'Confirmed',  2, '2026-02-22 08:30:00'),
    -- res-007: James Wilson, Room 203, checked out (past)
    (7, 2, 6,    NULL, '2026-02-10', '2026-02-14', 'Room',  'CheckedOut', 3, '2026-02-05 15:20:00');

SET IDENTITY_INSERT [hotel].[Reservations] OFF;
GO

PRINT 'Inserted 7 reservations.';
GO

-- ============================================================
-- 8. Invoices (for reservations that have billing)
-- ============================================================
SET IDENTITY_INSERT [hotel].[Invoices] ON;

INSERT INTO [hotel].[Invoices] (invoiceId, reservationId, invoiceDate, subtotal, tax, total, status)
VALUES
    -- Invoice for res-001 (Maria, Room 102, 4 nights @ 85 + services)
    (1, 1, '2026-02-20 12:00:00', 470.00,  47.00,  517.00, 'Partial'),
    -- Invoice for res-002 (James, Room 202, 4 nights @ 250 + services)
    (2, 2, '2026-02-21 15:00:00', 1045.00, 104.50, 1149.50, 'Unpaid'),
    -- Invoice for res-004 (Marco, Room 303, 3 nights @ 95 + services)
    (3, 4, '2026-02-19 13:00:00', 375.00,  37.50,  412.50, 'Paid'),
    -- Invoice for res-006 (Maria, Room 201, 2 nights @ 130)
    (4, 6, '2026-02-22 09:00:00', 260.00,  26.00,  286.00, 'Unpaid'),
    -- Invoice for res-007 (James, Room 203, 4 nights @ 350 + services)
    (5, 7, '2026-02-14 11:00:00', 1590.00, 159.00, 1749.00, 'Paid');

SET IDENTITY_INSERT [hotel].[Invoices] OFF;
GO

PRINT 'Inserted 5 invoices.';
GO

-- ============================================================
-- 9. Service Usages (services consumed during stays)
-- ============================================================
SET IDENTITY_INSERT [hotel].[ServiceUsages] ON;

INSERT INTO [hotel].[ServiceUsages] (usageId, invoiceId, serviceId, quantity, dateTime, totalPrice)
VALUES
    -- res-001: Room Service Breakfast x2, Spa Treatment x1
    (1, 1, 1, 2, '2026-02-21 08:30:00', 50.00),
    (2, 1, 4, 1, '2026-02-21 14:00:00', 80.00),
    -- res-002: Mini Bar x1
    (3, 2, 3, 1, '2026-02-22 22:00:00', 45.00),
    -- res-004: Laundry Service x1, Airport Transfer x1
    (4, 3, 5, 1, '2026-02-20 10:00:00', 30.00),
    (5, 3, 6, 1, '2026-02-22 06:00:00', 60.00),
    -- res-007: Room Service Dinner x2, Spa Treatment x1
    (6, 5, 2, 2, '2026-02-11 19:30:00', 110.00),
    (7, 5, 4, 1, '2026-02-12 15:00:00', 80.00);

SET IDENTITY_INSERT [hotel].[ServiceUsages] OFF;
GO

PRINT 'Inserted 7 service usages.';
GO

-- ============================================================
-- 10. Payments
-- ============================================================
SET IDENTITY_INSERT [hotel].[Payments] ON;

INSERT INTO [hotel].[Payments] (paymentId, invoiceId, amount, method, paidAt, status)
VALUES
    -- res-001: partial payment
    (1, 1, 300.00,  'Card',         '2026-02-20 12:30:00', 'Completed'),
    -- res-004: fully paid
    (2, 3, 412.50,  'Cash',         '2026-02-22 10:00:00', 'Completed'),
    -- res-007: fully paid
    (3, 5, 1749.00, 'Card',         '2026-02-14 11:30:00', 'Completed');

SET IDENTITY_INSERT [hotel].[Payments] OFF;
GO

PRINT 'Inserted 3 payments.';
GO

-- ============================================================
-- 11. Inventory Transactions (sample movements)
-- ============================================================
SET IDENTITY_INSERT [hotel].[InventoryTransactions] ON;

INSERT INTO [hotel].[InventoryTransactions] (transactionId, itemId, recordedBy, type, quantity, dateTime, notes)
VALUES
    -- Restocking towels
    (1,  1, 4, 'IN',  50, '2026-02-15 08:00:00', 'Monthly linen delivery'),
    -- Towels used for rooms
    (2,  1, 4, 'OUT', 12, '2026-02-20 07:30:00', 'Daily room refresh'),
    -- Shampoo restock
    (3,  3, 4, 'IN',  100, '2026-02-10 09:00:00', 'Supplier delivery'),
    -- Shampoo distributed
    (4,  3, 4, 'OUT', 30,  '2026-02-18 08:00:00', 'Room replenishment'),
    -- Water restock
    (5,  6, 4, 'IN',  200, '2026-02-12 10:00:00', 'Beverage order'),
    -- Water used
    (6,  6, 4, 'OUT', 155, '2026-02-20 16:00:00', 'Mini-bar and restaurant use'),
    -- Soap restock
    (7,  4, 4, 'IN',  50,  '2026-02-14 09:00:00', 'Toiletry delivery'),
    -- Coffee restock
    (8,  5, 4, 'IN',  150, '2026-02-16 08:00:00', 'Food supplies delivery'),
    -- Coffee used
    (9,  5, 4, 'OUT', 40,  '2026-02-21 07:00:00', 'Breakfast service'),
    -- Hand sanitizer critically low - restock
    (10, 10, 4, 'IN', 20, '2026-02-22 11:00:00', 'Emergency reorder - below threshold');

SET IDENTITY_INSERT [hotel].[InventoryTransactions] OFF;
GO

PRINT 'Inserted 10 inventory transactions.';
PRINT '';
PRINT '====================================';
PRINT 'Seed data loaded successfully!';
PRINT '====================================';
GO
