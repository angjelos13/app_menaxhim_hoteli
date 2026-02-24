-- ============================================================
-- Script 01: Create Database
-- Hotel Management System - SQL Server
-- Run this in SSMS connected to the master database
-- ============================================================

USE master;
GO

-- Drop if exists (for clean re-runs during development)
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'HotelManagementDB')
BEGIN
    ALTER DATABASE [HotelManagementDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [HotelManagementDB];
END
GO

-- Create the database
CREATE DATABASE [HotelManagementDB];
GO

-- Switch to the new database
USE [HotelManagementDB];
GO

-- Create the schema
CREATE SCHEMA [hotel];
GO

PRINT 'Database [HotelManagementDB] and schema [hotel] created successfully.';
GO
