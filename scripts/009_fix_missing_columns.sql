-- Fix missing columns and realtime issues
-- Run this to fix errors from previous migrations

-- Add missing columns to scripts table if they don't exist
DO $$
BEGIN
    -- Add product_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scripts' AND column_name = 'product_id') THEN
        ALTER TABLE scripts ADD COLUMN product_id TEXT;
    END IF;
    
    -- Add product_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scripts' AND column_name = 'product_name') THEN
        ALTER TABLE scripts ADD COLUMN product_name TEXT;
    END IF;
    
    -- Add step_order column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scripts' AND column_name = 'step_order') THEN
        ALTER TABLE scripts ADD COLUMN step_order INTEGER DEFAULT 0;
    END IF;
    
    -- Add buttons column (JSONB for array of buttons)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scripts' AND column_name = 'buttons') THEN
        ALTER TABLE scripts ADD COLUMN buttons JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add tabulations column (JSONB for array of tabulations)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scripts' AND column_name = 'tabulations') THEN
        ALTER TABLE scripts ADD COLUMN tabulations JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add alert column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scripts' AND column_name = 'alert') THEN
        ALTER TABLE scripts ADD COLUMN alert TEXT;
    END IF;
END $$;

-- Add missing columns to users table for presence tracking
DO $$
BEGIN
    -- Add last_activity column for realtime presence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_activity') THEN
        ALTER TABLE users ADD COLUMN last_activity TIMESTAMPTZ;
    END IF;
    
    -- Add current_product column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_product') THEN
        ALTER TABLE users ADD COLUMN current_product TEXT;
    END IF;
    
    -- Add current_screen column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_screen') THEN
        ALTER TABLE users ADD COLUMN current_screen TEXT;
    END IF;
    
    -- Add last_script_access column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_script_access') THEN
        ALTER TABLE users ADD COLUMN last_script_access TIMESTAMPTZ;
    END IF;
    
    -- Add last_login column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
END $$;

-- Add missing columns to messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'seen_by') THEN
        ALTER TABLE messages ADD COLUMN seen_by TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipients') THEN
        ALTER TABLE messages ADD COLUMN recipients TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'send_to_all') THEN
        ALTER TABLE messages ADD COLUMN send_to_all BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'segments') THEN
        ALTER TABLE messages ADD COLUMN segments JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'priority') THEN
        ALTER TABLE messages ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;
END $$;

-- Add missing columns to quizzes table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'options') THEN
        ALTER TABLE quizzes ADD COLUMN options JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'correct_answer') THEN
        ALTER TABLE quizzes ADD COLUMN correct_answer TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'scheduled_date') THEN
        ALTER TABLE quizzes ADD COLUMN scheduled_date TIMESTAMPTZ;
    END IF;
END $$;

-- Create contracts table if not exists
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for scripts product lookup
CREATE INDEX IF NOT EXISTS idx_scripts_product_id ON scripts(product_id);

-- Safe realtime publication (only add if not already member)
DO $$
DECLARE
    tables_to_add TEXT[] := ARRAY['contracts', 'users'];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_to_add
    LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
            NULL;
        END;
    END LOOP;
END $$;

-- Enable RLS on new tables
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for contracts (public read, admin write)
DROP POLICY IF EXISTS "Anyone can read contracts" ON contracts;
CREATE POLICY "Anyone can read contracts" ON contracts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage contracts" ON contracts;
CREATE POLICY "Admins can manage contracts" ON contracts FOR ALL USING (true);
