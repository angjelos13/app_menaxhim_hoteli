-- ============================================================
-- Script 02: Create Tables with Constraints
-- Hotel Management System - SQL Server
-- Run this in SSMS after 01-create-database.sql
-- ============================================================

USE [HotelManagementDB];
GO

-- ============================================================
-- 1. Users (staff accounts)
-- ============================================================
CREATE TABLE [hotel].[Users] (
    userId          INT             IDENTITY(1,1)   NOT NULL,
    username        NVARCHAR(50)    NOT NULL,
    passwordHash    NVARCHAR(256)   NOT NULL,
    role            NVARCHAR(20)    NOT NULL,
    isActive        BIT             NOT NULL        DEFAULT 1,
    createdAt       DATETIME2       NOT NULL        DEFAULT GETDATE(),

    CONSTRAINT PK_Users              PRIMARY KEY (userId),
    CONSTRAINT UQ_Users_Username     UNIQUE (username),
    CONSTRAINT CK_Users_Role         CHECK (role IN ('Receptionist', 'Operational', 'Administrator'))
);
GO

-- ============================================================
-- 2. Customers (hotel guests)
-- ============================================================
CREATE TABLE [hotel].[Customers] (
    customerId      INT             IDENTITY(1,1)   NOT NULL,
    fullName        NVARCHAR(100)   NOT NULL,
    phone           NVARCHAR(30)    NULL,
    email           NVARCHAR(100)   NULL,
    idCardNo        NVARCHAR(50)    NULL,

    CONSTRAINT PK_Customers          PRIMARY KEY (customerId),
    CONSTRAINT UQ_Customers_Email    UNIQUE (email)
);
GO

-- ============================================================
-- 3. Rooms
-- ============================================================
CREATE TABLE [hotel].[Rooms] (
    roomId          INT             IDENTITY(1,1)   NOT NULL,
    roomNumber      NVARCHAR(10)    NOT NULL,
    type            NVARCHAR(20)    NOT NULL,
    floor           INT             NOT NULL        DEFAULT 1,
    pricePerNight   DECIMAL(10,2)   NOT NULL,
    capacity        INT             NOT NULL        DEFAULT 1,
    status          NVARCHAR(20)    NOT NULL        DEFAULT 'Available',

    CONSTRAINT PK_Rooms              PRIMARY KEY (roomId),
    CONSTRAINT UQ_Rooms_Number       UNIQUE (roomNumber),
    CONSTRAINT CK_Rooms_Status       CHECK (status IN ('Available', 'Reserved', 'Occupied', 'Cleaning', 'Maintenance')),
    CONSTRAINT CK_Rooms_Type         CHECK (type IN ('Single', 'Double', 'Suite', 'Deluxe')),
    CONSTRAINT CK_Rooms_Price        CHECK (pricePerNight > 0)
);
GO

-- ============================================================
-- 4. Tables (restaurant)
-- ============================================================
CREATE TABLE [hotel].[Tables] (
    tableId         INT             IDENTITY(1,1)   NOT NULL,
    tableNumber     NVARCHAR(10)    NOT NULL,
    capacity        INT             NOT NULL,
    location        NVARCHAR(20)    NOT NULL        DEFAULT 'Indoor',
    status          NVARCHAR(20)    NOT NULL        DEFAULT 'Available',

    CONSTRAINT PK_Tables             PRIMARY KEY (tableId),
    CONSTRAINT UQ_Tables_Number      UNIQUE (tableNumber),
    CONSTRAINT CK_Tables_Status      CHECK (status IN ('Available', 'Reserved', 'Occupied')),
    CONSTRAINT CK_Tables_Location    CHECK (location IN ('Indoor', 'Terrace', 'Private')),
    CONSTRAINT CK_Tables_Capacity    CHECK (capacity > 0)
);
GO

-- ============================================================
-- 5. Services (catalogue of available services)
-- ============================================================
CREATE TABLE [hotel].[Services] (
    serviceId       INT             IDENTITY(1,1)   NOT NULL,
    name            NVARCHAR(100)   NOT NULL,
    unitPrice       DECIMAL(10,2)   NOT NULL,
    category        NVARCHAR(50)    NULL,

    CONSTRAINT PK_Services           PRIMARY KEY (serviceId),
    CONSTRAINT UQ_Services_Name      UNIQUE (name),
    CONSTRAINT CK_Services_Price     CHECK (unitPrice >= 0)
);
GO

-- ============================================================
-- 6. Inventory Items
-- ============================================================
CREATE TABLE [hotel].[InventoryItems] (
    itemId          INT             IDENTITY(1,1)   NOT NULL,
    name            NVARCHAR(100)   NOT NULL,
    unit            NVARCHAR(30)    NOT NULL,
    category        NVARCHAR(30)    NULL,
    quantityOnHand  INT             NOT NULL        DEFAULT 0,
    minThreshold    INT             NOT NULL        DEFAULT 0,

    CONSTRAINT PK_InventoryItems     PRIMARY KEY (itemId),
    CONSTRAINT UQ_InventoryItems_Name UNIQUE (name),
    CONSTRAINT CK_InventoryItems_Qty CHECK (quantityOnHand >= 0),
    CONSTRAINT CK_InventoryItems_Cat CHECK (category IN ('Linens', 'Toiletries', 'Food', 'Beverages', 'Cleaning'))
);
GO

-- ============================================================
-- 7. Reservations
-- ============================================================
CREATE TABLE [hotel].[Reservations] (
    reservationId   INT             IDENTITY(1,1)   NOT NULL,
    customerId      INT             NOT NULL,
    roomId          INT             NULL,
    tableId         INT             NULL,
    startDate       DATE            NOT NULL,
    endDate         DATE            NOT NULL,
    reservationType NVARCHAR(10)    NOT NULL,
    status          NVARCHAR(20)    NOT NULL        DEFAULT 'Pending',
    createdBy       INT             NOT NULL,
    createdAt       DATETIME2       NOT NULL        DEFAULT GETDATE(),

    CONSTRAINT PK_Reservations               PRIMARY KEY (reservationId),
    CONSTRAINT FK_Reservations_Customer      FOREIGN KEY (customerId) REFERENCES [hotel].[Customers](customerId),
    CONSTRAINT FK_Reservations_Room          FOREIGN KEY (roomId)     REFERENCES [hotel].[Rooms](roomId),
    CONSTRAINT FK_Reservations_Table         FOREIGN KEY (tableId)    REFERENCES [hotel].[Tables](tableId),
    CONSTRAINT FK_Reservations_CreatedBy     FOREIGN KEY (createdBy)  REFERENCES [hotel].[Users](userId),
    CONSTRAINT CK_Reservations_Type          CHECK (reservationType IN ('Room', 'Table')),
    CONSTRAINT CK_Reservations_Status        CHECK (status IN ('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'Completed')),
    CONSTRAINT CK_Reservations_Dates         CHECK (endDate >= startDate),
    CONSTRAINT CK_Reservations_RoomOrTable   CHECK (
        (reservationType = 'Room'  AND roomId  IS NOT NULL AND tableId IS NULL) OR
        (reservationType = 'Table' AND tableId IS NOT NULL AND roomId  IS NULL)
    )
);
GO

-- ============================================================
-- 8. Invoices
-- ============================================================
CREATE TABLE [hotel].[Invoices] (
    invoiceId       INT             IDENTITY(1,1)   NOT NULL,
    reservationId   INT             NOT NULL,
    invoiceDate     DATETIME2       NOT NULL        DEFAULT GETDATE(),
    subtotal        DECIMAL(12,2)   NOT NULL        DEFAULT 0,
    tax             DECIMAL(12,2)   NOT NULL        DEFAULT 0,
    total           DECIMAL(12,2)   NOT NULL        DEFAULT 0,
    status          NVARCHAR(10)    NOT NULL        DEFAULT 'Unpaid',

    CONSTRAINT PK_Invoices                   PRIMARY KEY (invoiceId),
    CONSTRAINT FK_Invoices_Reservation       FOREIGN KEY (reservationId) REFERENCES [hotel].[Reservations](reservationId),
    CONSTRAINT UQ_Invoices_Reservation       UNIQUE (reservationId),
    CONSTRAINT CK_Invoices_Status            CHECK (status IN ('Unpaid', 'Paid', 'Partial')),
    CONSTRAINT CK_Invoices_Amounts           CHECK (subtotal >= 0 AND tax >= 0 AND total >= 0)
);
GO

-- ============================================================
-- 9. Payments
-- ============================================================
CREATE TABLE [hotel].[Payments] (
    paymentId       INT             IDENTITY(1,1)   NOT NULL,
    invoiceId       INT             NOT NULL,
    amount          DECIMAL(12,2)   NOT NULL,
    method          NVARCHAR(20)    NOT NULL,
    paidAt          DATETIME2       NOT NULL        DEFAULT GETDATE(),
    status          NVARCHAR(20)    NOT NULL        DEFAULT 'Completed',

    CONSTRAINT PK_Payments                   PRIMARY KEY (paymentId),
    CONSTRAINT FK_Payments_Invoice           FOREIGN KEY (invoiceId) REFERENCES [hotel].[Invoices](invoiceId),
    CONSTRAINT CK_Payments_Amount            CHECK (amount > 0),
    CONSTRAINT CK_Payments_Method            CHECK (method IN ('Cash', 'Card', 'BankTransfer'))
);
GO

-- ============================================================
-- 10. Service Usages (services consumed per invoice)
-- ============================================================
CREATE TABLE [hotel].[ServiceUsages] (
    usageId         INT             IDENTITY(1,1)   NOT NULL,
    invoiceId       INT             NOT NULL,
    serviceId       INT             NOT NULL,
    quantity        INT             NOT NULL        DEFAULT 1,
    dateTime        DATETIME2       NOT NULL        DEFAULT GETDATE(),
    totalPrice      DECIMAL(10,2)   NOT NULL,

    CONSTRAINT PK_ServiceUsages              PRIMARY KEY (usageId),
    CONSTRAINT FK_ServiceUsages_Invoice      FOREIGN KEY (invoiceId)  REFERENCES [hotel].[Invoices](invoiceId),
    CONSTRAINT FK_ServiceUsages_Service      FOREIGN KEY (serviceId)  REFERENCES [hotel].[Services](serviceId),
    CONSTRAINT CK_ServiceUsages_Qty          CHECK (quantity > 0),
    CONSTRAINT CK_ServiceUsages_Price        CHECK (totalPrice >= 0)
);
GO

-- ============================================================
-- 11. Inventory Transactions
-- ============================================================
CREATE TABLE [hotel].[InventoryTransactions] (
    transactionId   INT             IDENTITY(1,1)   NOT NULL,
    itemId          INT             NOT NULL,
    recordedBy      INT             NOT NULL,
    type            NVARCHAR(5)     NOT NULL,
    quantity        INT             NOT NULL,
    dateTime        DATETIME2       NOT NULL        DEFAULT GETDATE(),
    notes           NVARCHAR(500)   NULL,

    CONSTRAINT PK_InventoryTransactions              PRIMARY KEY (transactionId),
    CONSTRAINT FK_InventoryTransactions_Item          FOREIGN KEY (itemId)      REFERENCES [hotel].[InventoryItems](itemId),
    CONSTRAINT FK_InventoryTransactions_RecordedBy    FOREIGN KEY (recordedBy)  REFERENCES [hotel].[Users](userId),
    CONSTRAINT CK_InventoryTransactions_Type          CHECK (type IN ('IN', 'OUT')),
    CONSTRAINT CK_InventoryTransactions_Qty           CHECK (quantity > 0)
);
GO

PRINT 'All 11 tables created successfully in schema [hotel].';
GO
