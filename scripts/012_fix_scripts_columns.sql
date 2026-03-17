-- Fix scripts table columns for JSON import
-- Run this script to add missing columns to the scripts table

-- Add product_id column
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS product_id TEXT;

-- Add product_name column
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Add step_order column
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS step_order INTEGER DEFAULT 0;

-- Add buttons column (JSONB array)
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS buttons JSONB DEFAULT '[]'::jsonb;

-- Add tabulations column (JSONB array)
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS tabulations JSONB DEFAULT '[]'::jsonb;

-- Add alert column
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS alert TEXT;

-- Create index for faster product lookups
CREATE INDEX IF NOT EXISTS idx_scripts_product_id ON scripts(product_id);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scripts';
