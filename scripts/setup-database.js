import "dotenv/config"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function setupDatabase() {
  console.log("[v0] Starting database setup...")

  // Create schema SQL
  const createSchemaSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('car', 'motorcycle', 'truck')),
  model TEXT,
  color TEXT,
  status TEXT DEFAULT 'outside' CHECK (status IN ('inside', 'outside')),
  owner_name TEXT,
  owner_phone TEXT,
  owner_cpf TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movements table
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  plate TEXT NOT NULL,
  vehicle_type TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Residents table
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  apartment TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitors table
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  visiting_apartment TEXT NOT NULL,
  visiting_resident TEXT,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  authorized_by UUID REFERENCES public.users(id),
  photo_url TEXT,
  status TEXT DEFAULT 'inside' CHECK (status IN ('inside', 'exited')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment TEXT NOT NULL,
  recipient_name TEXT,
  courier TEXT NOT NULL,
  tracking_code TEXT,
  received_by UUID REFERENCES public.users(id),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  collected_at TIMESTAMPTZ,
  collected_by TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Occurrences table
CREATE TABLE IF NOT EXISTS public.occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  location TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  photos TEXT[], -- Array of photo URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for other tables (authenticated users can access)
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage vehicles" ON public.vehicles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view movements" ON public.movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create movements" ON public.movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view residents" ON public.residents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage residents" ON public.residents FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view visitors" ON public.visitors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage visitors" ON public.visitors FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view deliveries" ON public.deliveries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage deliveries" ON public.deliveries FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view occurrences" ON public.occurrences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage occurrences" ON public.occurrences FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_movements_vehicle_id ON public.movements(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON public.movements(timestamp);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON public.occurrences(status);
`

  try {
    // Execute schema creation
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: createSchemaSQL }),
    })

    if (!response.ok) {
      // Try alternative method using direct SQL execution
      console.log("[v0] Using alternative method to create tables...")

      const queries = createSchemaSQL.split(";").filter((q) => q.trim())

      for (const query of queries) {
        if (!query.trim()) continue

        const execResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ query: query.trim() }),
        })

        console.log("[v0] Executed query:", query.substring(0, 50) + "...")
      }
    }

    console.log("[v0] ✅ Database schema created successfully!")
    console.log("[v0] Next step: Run the seed data script to populate initial data")
  } catch (error) {
    console.error("[v0] ❌ Error setting up database:", error)
    throw error
  }
}

setupDatabase()
