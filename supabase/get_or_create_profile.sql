-- Crea (si no existe) el perfil y el comercio del usuario autenticado.
-- SECURITY DEFINER: no depende de RLS policies del cliente.

-- 1) Reaseguro de policies de businesses/profiles (estado limpio, idempotente)
DROP POLICY IF EXISTS "Users can view own business" ON businesses;
CREATE POLICY "Users can view own business" ON businesses
  FOR SELECT USING (id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can update own business" ON businesses;
CREATE POLICY "Admins can update own business" ON businesses
  FOR UPDATE USING (id = get_user_business_id() AND is_admin());

DROP POLICY IF EXISTS "Admins can insert business" ON businesses;
CREATE POLICY "Admins can insert business" ON businesses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 2) Función que arma perfil + comercio + depósito + trial sin pasar por RLS
CREATE OR REPLACE FUNCTION get_or_create_profile()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_business_id uuid;
  v_email text;
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;

  IF NOT FOUND THEN
    SELECT u.email, COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
      INTO v_email, v_name
    FROM auth.users u
    WHERE u.id = v_user_id;

    INSERT INTO profiles (id, email, name, role)
    VALUES (v_user_id, COALESCE(v_email, 'sin-email'), COALESCE(v_name, 'Usuario'), 'admin')
    RETURNING * INTO v_profile;
  END IF;

  IF v_profile.business_id IS NULL THEN
    INSERT INTO businesses (name, rubro)
    VALUES (COALESCE(NULLIF(v_profile.name, ''), 'Mi Comercio'), 'otro')
    RETURNING id INTO v_business_id;

    UPDATE profiles SET business_id = v_business_id WHERE id = v_user_id;
    v_profile.business_id := v_business_id;

    INSERT INTO warehouses (name, is_default, business_id)
    VALUES ('Local', true, v_business_id);

    INSERT INTO subscriptions (business_id)
    VALUES (v_business_id);
  END IF;

  RETURN NEXT v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_profile() TO authenticated, anon;
