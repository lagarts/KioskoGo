-- ============================================
-- PANEL DE ADMINISTRACIÓN (solo cuenta principal)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- ¿Es la cuenta super admin? (la dueña de la app)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND lower(email) = 'graficacovacimprenta@gmail.com'
  );
$$;

-- Listar todos los usuarios registrados con su suscripción
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  registered_at timestamptz,
  business_name text,
  sub_status text,
  sub_plan text,
  trial_starts_at timestamptz,
  trial_ends_at timestamptz,
  days_left integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    b.name,
    s.status,
    s.plan,
    s.trial_start,
    s.trial_end,
    CASE
      WHEN s.trial_end IS NULL THEN NULL
      ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (s.trial_end - now())) / 86400))::integer
    END
  FROM profiles p
  LEFT JOIN businesses b ON b.id = p.business_id
  LEFT JOIN LATERAL (
    SELECT * FROM subscriptions sub
    WHERE sub.business_id = p.business_id
    ORDER BY sub.created_at DESC
    LIMIT 1
  ) s ON true
  ORDER BY p.created_at DESC;
END;
$$;

-- Eliminar un usuario (cuenta + datos si queda sin gente en su comercio)
CREATE OR REPLACE FUNCTION admin_delete_user(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business uuid;
  v_remaining integer;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'No podés eliminar tu propia cuenta';
  END IF;

  SELECT profiles.business_id INTO v_business
  FROM profiles WHERE profiles.id = target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  DELETE FROM auth.users WHERE id = target;

  IF v_business IS NOT NULL THEN
    SELECT count(*) INTO v_remaining
    FROM profiles WHERE profiles.business_id = v_business;
    IF v_remaining = 0 THEN
      DELETE FROM businesses WHERE id = v_business;
    END IF;
  END IF;
END;
$$;

-- Dar "gratis para siempre" al comercio de un usuario
CREATE OR REPLACE FUNCTION admin_grant_forever(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business uuid;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT profiles.business_id INTO v_business
  FROM profiles WHERE profiles.id = target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene comercio asignado';
  END IF;

  UPDATE subscriptions
  SET status = 'active',
      trial_end = NULL,
      trial_start = COALESCE(trial_start, now())
  WHERE business_id = v_business;

  IF NOT FOUND THEN
    INSERT INTO subscriptions (business_id, status, plan, trial_start, trial_end)
    VALUES (v_business, 'active', 'free_trial', now(), NULL);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_forever(uuid) TO authenticated;
