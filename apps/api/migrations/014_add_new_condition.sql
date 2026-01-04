-- Migration: 014_add_new_condition.sql
-- Description: Add 'new' value to equipment_condition enum
-- Date: 2026-01-04

-- Add 'new' to equipment_condition enum
ALTER TYPE equipment_condition ADD VALUE IF NOT EXISTS 'new' BEFORE 'excellent';
