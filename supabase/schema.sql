-- =====================================================================
-- LaunchUF — databasschema (kör HELA filen en gång i Supabase → SQL Editor)
-- Säker att köra om: använder IF NOT EXISTS / DROP POLICY IF EXISTS.
-- Orders och meddelanden skrivs ENDAST av servern (service role).
-- Webbläsaren (anon) har ingen skrivåtkomst alls. Admin styrs av has_role().
-- =====================================================================

-- ---------- Typer ----------
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('new', 'contacted', 'in_progress', 'review', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Roller ----------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Litar aldrig på ett användar-id från klienten: använder alltid auth.uid().
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- Tidsstämpel-trigger ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- Webbplatsinställningar (redigeras i admin) ----------
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY CHECK (char_length(key) BETWEEN 1 AND 60),
  value text NOT NULL DEFAULT '' CHECK (char_length(value) <= 500),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;
CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES
  ('delivery_text', '2–5 dagar'),
  ('price_start', '999'),
  ('price_growth', '1499'),
  ('price_premium', '2499'),
  ('price_uf', '299'),
  ('price_domain', '99')
ON CONFLICT (key) DO NOTHING;

-- ---------- Beställningar ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  package_code text NOT NULL CHECK (package_code IN ('start', 'growth', 'premium', 'uf', 'custom')),
  source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'manual')),
  company_name text NOT NULL CHECK (char_length(company_name) BETWEEN 1 AND 120),
  contact_name text NOT NULL DEFAULT '' CHECK (char_length(contact_name) <= 120),
  email text NOT NULL DEFAULT '' CHECK (char_length(email) <= 255),
  phone text CHECK (char_length(phone) <= 40),
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  needs_quote boolean NOT NULL DEFAULT false,
  domain_option text NOT NULL DEFAULT 'none' CHECK (domain_option IN ('none', 'owned', 'setup')),
  domain_name text CHECK (char_length(domain_name) <= 120),
  launch_date date,
  logo_path text,
  pay_preference text NOT NULL DEFAULT 'later' CHECK (pay_preference IN ('now', 'later')),
  status public.order_status NOT NULL DEFAULT 'new',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  amount_kr integer NOT NULL CHECK (amount_kr BETWEEN 0 AND 200000),
  stripe_session_id text,
  stripe_payment_intent text,
  internal_notes text CHECK (char_length(internal_notes) <= 5000),
  next_action text CHECK (char_length(next_action) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role('admin'));
CREATE POLICY "Admins insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role('admin'));

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status, payment_status);
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (lower(email), created_at DESC);

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Kontaktmeddelanden ----------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 255),
  subject text CHECK (char_length(subject) <= 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

DROP POLICY IF EXISTS "Admins manage messages" ON public.contact_messages;
CREATE POLICY "Admins manage messages" ON public.contact_messages FOR ALL TO authenticated
  USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON public.contact_messages (created_at DESC);

-- ---------- Logotyper (privat bucket, bara admin kan läsa/ta bort) ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-logos', 'order-logos', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

DROP POLICY IF EXISTS "Admins read order logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete order logos" ON storage.objects;
CREATE POLICY "Admins read order logos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'order-logos' AND public.has_role('admin'));
CREATE POLICY "Admins delete order logos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'order-logos' AND public.has_role('admin'));

-- =====================================================================
-- SKAPA FÖRSTA ADMIN (efter att du skapat användaren i Supabase → Authentication → Users):
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<user-id-från-auth>', 'admin');
-- =====================================================================

-- ---------- Kundwebbplatser (visas på startsidan, hanteras i admin → Kunder) ----------
CREATE TABLE IF NOT EXISTS public.client_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  url text NOT NULL CHECK (url ~* '^https://' AND char_length(url) <= 300),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 300),
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_sites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_sites FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_sites TO authenticated;
GRANT ALL ON public.client_sites TO service_role;
DROP POLICY IF EXISTS "Admins manage client sites" ON public.client_sites;
CREATE POLICY "Admins manage client sites" ON public.client_sites FOR ALL TO authenticated
  USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- ---------- Publik läsning av offentlig data (så sajten fungerar även utan service role) ----------
GRANT SELECT ON public.site_settings TO anon;
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.client_sites TO anon;
DROP POLICY IF EXISTS "Public read visible clients" ON public.client_sites;
CREATE POLICY "Public read visible clients" ON public.client_sites FOR SELECT TO anon USING (visible = true);

-- Live-förhandsvisning per kund (kan stängas av om kundens sida inte tillåter inbäddning)
ALTER TABLE public.client_sites ADD COLUMN IF NOT EXISTS show_preview boolean NOT NULL DEFAULT true;
