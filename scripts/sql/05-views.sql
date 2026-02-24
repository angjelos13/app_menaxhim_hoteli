-- ============================================================
-- Script 05: Views
-- Hotel Management System - SQL Server
-- Run this in SSMS after 04-indexes.sql
-- ============================================================

USE [HotelManagementDB];
GO

-- ============================================================
-- View 1: Reservation Details
-- Joins reservation with customer, room/table, and creator
-- Used by: Reservations page, Check-in queue, Dashboard
-- ============================================================
CREATE OR ALTER VIEW [hotel].[vw_ReservationDetails]
AS
SELECT
    r.reservationId,
    r.reservationType,
    r.startDate,
    r.endDate,
    DATEDIFF(DAY, r.startDate, r.endDate) AS nights,
    r.status          AS reservationStatus,
    r.createdAt,

    -- Customer info
    c.customerId,
    c.fullName        AS customerName,
    c.phone           AS customerPhone,
    c.email           AS customerEmail,
    c.idCardNo        AS customerIdCard,

    -- Room info (NULL if table reservation)
    rm.roomId,
    rm.roomNumber,
    rm.type           AS roomType,
    rm.floor          AS roomFloor,
    rm.pricePerNight,
    rm.status         AS roomStatus,

    -- Table info (NULL if room reservation)
    t.tableId,
    t.tableNumber,
    t.capacity        AS tableCapacity,
    t.location        AS tableLocation,
    t.status          AS tableStatus,

    -- Creator info
    u.userId          AS createdByUserId,
    u.username        AS createdByUsername,

    -- Invoice summary
    i.invoiceId,
    i.total           AS invoiceTotal,
    i.status          AS invoiceStatus

FROM [hotel].[Reservations] r
    INNER JOIN [hotel].[Customers] c  ON r.customerId = c.customerId
    INNER JOIN [hotel].[Users]     u  ON r.createdBy  = u.userId
    LEFT  JOIN [hotel].[Rooms]     rm ON r.roomId     = rm.roomId
    LEFT  JOIN [hotel].[Tables]    t  ON r.tableId    = t.tableId
    LEFT  JOIN [hotel].[Invoices]  i  ON r.reservationId = i.reservationId;
GO

PRINT 'Created view: vw_ReservationDetails';
GO

-- ============================================================
-- View 2: Invoice Details (with services and payments)
-- Used by: Invoicing page, Payment recording
-- ============================================================
CREATE OR ALTER VIEW [hotel].[vw_InvoiceDetails]
AS
SELECT
    i.invoiceId,
    i.invoiceDate,
    i.subtotal,
    i.tax,
    i.total,
    i.status          AS invoiceStatus,

    -- Reservation info
    r.reservationId,
    r.reservationType,
    r.startDate,
    r.endDate,

    -- Customer info
    c.customerId,
    c.fullName        AS customerName,
    c.email           AS customerEmail,

    -- Room info
    rm.roomNumber,
    rm.type           AS roomType,
    rm.pricePerNight,

    -- Total services on this invoice
    (SELECT ISNULL(SUM(su.totalPrice), 0)
     FROM [hotel].[ServiceUsages] su
     WHERE su.invoiceId = i.invoiceId
    ) AS totalServicesAmount,

    -- Number of services
    (SELECT COUNT(*)
     FROM [hotel].[ServiceUsages] su
     WHERE su.invoiceId = i.invoiceId
    ) AS serviceCount,

    -- Total paid so far
    (SELECT ISNULL(SUM(p.amount), 0)
     FROM [hotel].[Payments] p
     WHERE p.invoiceId = i.invoiceId
       AND p.status = 'Completed'
    ) AS totalPaid,

    -- Remaining balance
    i.total - (
        SELECT ISNULL(SUM(p.amount), 0)
        FROM [hotel].[Payments] p
        WHERE p.invoiceId = i.invoiceId
          AND p.status = 'Completed'
    ) AS remainingBalance

FROM [hotel].[Invoices]      i
    INNER JOIN [hotel].[Reservations] r  ON i.reservationId = r.reservationId
    INNER JOIN [hotel].[Customers]    c  ON r.customerId    = c.customerId
    LEFT  JOIN [hotel].[Rooms]        rm ON r.roomId        = rm.roomId;
GO

PRINT 'Created view: vw_InvoiceDetails';
GO

-- ============================================================
-- View 3: Inventory Status
-- Shows current stock levels with threshold alerts
-- Used by: Inventory page, Dashboard low-stock alerts
-- ============================================================
CREATE OR ALTER VIEW [hotel].[vw_InventoryStatus]
AS
SELECT
    ii.itemId,
    ii.name,
    ii.unit,
    ii.category,
    ii.quantityOnHand,
    ii.minThreshold,
    ii.quantityOnHand - ii.minThreshold  AS surplusDeficit,

    CASE
        WHEN ii.quantityOnHand <= 0              THEN 'Out of Stock'
        WHEN ii.quantityOnHand < ii.minThreshold THEN 'Low Stock'
        WHEN ii.quantityOnHand < ii.minThreshold * 1.5 THEN 'Warning'
        ELSE 'OK'
    END AS stockStatus,

    -- Last inbound transaction
    (SELECT TOP 1 it.dateTime
     FROM [hotel].[InventoryTransactions] it
     WHERE it.itemId = ii.itemId AND it.type = 'IN'
     ORDER BY it.dateTime DESC
    ) AS lastRestockDate,

    -- Total inbound this month
    (SELECT ISNULL(SUM(it.quantity), 0)
     FROM [hotel].[InventoryTransactions] it
     WHERE it.itemId = ii.itemId
       AND it.type = 'IN'
       AND it.dateTime >= DATEADD(DAY, -30, GETDATE())
    ) AS inboundLast30Days,

    -- Total outbound this month
    (SELECT ISNULL(SUM(it.quantity), 0)
     FROM [hotel].[InventoryTransactions] it
     WHERE it.itemId = ii.itemId
       AND it.type = 'OUT'
       AND it.dateTime >= DATEADD(DAY, -30, GETDATE())
    ) AS outboundLast30Days

FROM [hotel].[InventoryItems] ii;
GO

PRINT 'Created view: vw_InventoryStatus';
GO

-- ============================================================
-- View 4: Dashboard Statistics
-- Aggregated KPIs for the main dashboard
-- Used by: Dashboard Overview page
-- ============================================================
CREATE OR ALTER VIEW [hotel].[vw_DashboardStats]
AS
SELECT
    -- Room stats
    (SELECT COUNT(*) FROM [hotel].[Rooms])                                              AS totalRooms,
    (SELECT COUNT(*) FROM [hotel].[Rooms] WHERE status = 'Available')                   AS availableRooms,
    (SELECT COUNT(*) FROM [hotel].[Rooms] WHERE status = 'Occupied')                    AS occupiedRooms,
    (SELECT COUNT(*) FROM [hotel].[Rooms] WHERE status = 'Cleaning')                    AS cleaningRooms,
    (SELECT COUNT(*) FROM [hotel].[Rooms] WHERE status = 'Maintenance')                 AS maintenanceRooms,

    -- Occupancy rate
    CAST(
        (SELECT COUNT(*) FROM [hotel].[Rooms] WHERE status = 'Occupied') * 100.0 /
        NULLIF((SELECT COUNT(*) FROM [hotel].[Rooms]), 0)
    AS DECIMAL(5,2))                                                                    AS occupancyRate,

    -- Table stats
    (SELECT COUNT(*) FROM [hotel].[Tables])                                             AS totalTables,
    (SELECT COUNT(*) FROM [hotel].[Tables] WHERE status = 'Available')                  AS availableTables,

    -- Reservation stats
    (SELECT COUNT(*) FROM [hotel].[Reservations] WHERE status = 'CheckedIn')            AS activeGuests,
    (SELECT COUNT(*) FROM [hotel].[Reservations]
     WHERE status = 'Confirmed' AND startDate = CAST(GETDATE() AS DATE))                AS arrivalsToday,

    -- Revenue stats
    (SELECT ISNULL(SUM(total), 0) FROM [hotel].[Invoices] WHERE status = 'Paid')        AS totalRevenuePaid,
    (SELECT ISNULL(SUM(total), 0) FROM [hotel].[Invoices] WHERE status IN ('Unpaid', 'Partial')) AS totalOutstanding,

    -- Inventory alerts
    (SELECT COUNT(*) FROM [hotel].[InventoryItems]
     WHERE quantityOnHand < minThreshold)                                               AS lowStockItemCount;
GO

PRINT 'Created view: vw_DashboardStats';
GO

PRINT '';
PRINT '====================================';
PRINT 'All views created successfully!';
PRINT '';
PRINT 'Summary of SQL scripts:';
PRINT '  01-create-database.sql  - Database and schema';
PRINT '  02-create-tables.sql    - 11 tables with constraints';
PRINT '  03-seed-data.sql        - Sample data (~60+ rows)';
PRINT '  04-indexes.sql          - Performance indexes';
PRINT '  05-views.sql            - 4 reporting views';
PRINT '====================================';
GO
