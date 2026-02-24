-- ============================================================
-- Script 04: Performance Indexes
-- Hotel Management System - SQL Server
-- Run this in SSMS after 03-seed-data.sql
-- ============================================================

USE [HotelManagementDB];
GO

-- ============================================================
-- Reservations - heavily queried table
-- ============================================================

-- Lookup by customer (customer history)
CREATE NONCLUSTERED INDEX IX_Reservations_CustomerId
    ON [hotel].[Reservations] (customerId)
    INCLUDE (startDate, endDate, status, reservationType);
GO

-- Lookup by room (room availability / schedule)
CREATE NONCLUSTERED INDEX IX_Reservations_RoomId
    ON [hotel].[Reservations] (roomId)
    INCLUDE (startDate, endDate, status)
    WHERE roomId IS NOT NULL;
GO

-- Lookup by table (table availability / schedule)
CREATE NONCLUSTERED INDEX IX_Reservations_TableId
    ON [hotel].[Reservations] (tableId)
    INCLUDE (startDate, endDate, status)
    WHERE tableId IS NOT NULL;
GO

-- Filter by status (dashboard, check-in queue)
CREATE NONCLUSTERED INDEX IX_Reservations_Status
    ON [hotel].[Reservations] (status)
    INCLUDE (customerId, roomId, tableId, startDate, endDate);
GO

-- Filter by date range (calendar views, reports)
CREATE NONCLUSTERED INDEX IX_Reservations_Dates
    ON [hotel].[Reservations] (startDate, endDate)
    INCLUDE (status, reservationType, customerId);
GO

-- Lookup by creator (audit trail)
CREATE NONCLUSTERED INDEX IX_Reservations_CreatedBy
    ON [hotel].[Reservations] (createdBy);
GO

-- ============================================================
-- Invoices
-- ============================================================

-- Already has UNIQUE on reservationId, covering FK lookups
-- Filter by status (unpaid invoices report)
CREATE NONCLUSTERED INDEX IX_Invoices_Status
    ON [hotel].[Invoices] (status)
    INCLUDE (reservationId, total, invoiceDate);
GO

-- ============================================================
-- Payments
-- ============================================================

-- Lookup by invoice (payment history per invoice)
CREATE NONCLUSTERED INDEX IX_Payments_InvoiceId
    ON [hotel].[Payments] (invoiceId)
    INCLUDE (amount, method, paidAt, status);
GO

-- ============================================================
-- Service Usages
-- ============================================================

-- Lookup by invoice (invoice line items)
CREATE NONCLUSTERED INDEX IX_ServiceUsages_InvoiceId
    ON [hotel].[ServiceUsages] (invoiceId)
    INCLUDE (serviceId, quantity, totalPrice);
GO

-- Lookup by service (usage analytics)
CREATE NONCLUSTERED INDEX IX_ServiceUsages_ServiceId
    ON [hotel].[ServiceUsages] (serviceId)
    INCLUDE (invoiceId, quantity, totalPrice, dateTime);
GO

-- ============================================================
-- Inventory Transactions
-- ============================================================

-- Lookup by item (stock movement history)
CREATE NONCLUSTERED INDEX IX_InventoryTransactions_ItemId
    ON [hotel].[InventoryTransactions] (itemId)
    INCLUDE (type, quantity, dateTime);
GO

-- Lookup by recorder (audit trail)
CREATE NONCLUSTERED INDEX IX_InventoryTransactions_RecordedBy
    ON [hotel].[InventoryTransactions] (recordedBy);
GO

-- Filter by date (daily/monthly reports)
CREATE NONCLUSTERED INDEX IX_InventoryTransactions_DateTime
    ON [hotel].[InventoryTransactions] (dateTime)
    INCLUDE (itemId, type, quantity);
GO

-- ============================================================
-- Rooms & Tables - status filtering
-- ============================================================

CREATE NONCLUSTERED INDEX IX_Rooms_Status
    ON [hotel].[Rooms] (status)
    INCLUDE (roomNumber, type, pricePerNight);
GO

CREATE NONCLUSTERED INDEX IX_Tables_Status
    ON [hotel].[Tables] (status)
    INCLUDE (tableNumber, capacity, location);
GO

-- ============================================================
-- Users - role filtering
-- ============================================================

CREATE NONCLUSTERED INDEX IX_Users_Role
    ON [hotel].[Users] (role)
    INCLUDE (username, isActive);
GO

PRINT 'All performance indexes created successfully.';
GO
