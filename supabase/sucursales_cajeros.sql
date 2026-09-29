-- ============================================
-- SUCURSALES + CAJEROS (ejecutar en SQL Editor)
-- ============================================

-- 1. SUCURSALES
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own branches" ON branches;
CREATE POLICY "Users can view own branches" ON branches
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage branches" ON branches;
CREATE POLICY "Admins can manage branches" ON branches
  FOR ALL USING (business_id = get_user_business_id() AND is_admin())
  WITH CHECK (business_id = get_user_business_id() AND is_admin());

-- 2. Caja y ventas quedan ligadas a una sucursal
ALTER TABLE cash_registers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- 3. PRODUCTOS POR SUCURSAL
CREATE TABLE IF NOT EXISTS product_branches (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, branch_id)
);

ALTER TABLE product_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view product branches" ON product_branches;
CREATE POLICY "Users can view product branches" ON product_branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_branches.product_id
        AND products.business_id = get_user_business_id()
    )
  );

DROP POLICY IF EXISTS "Admins can manage product branches" ON product_branches;
CREATE POLICY "Admins can manage product branches" ON product_branches
  FOR ALL USING (
    is_admin() AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_branches.product_id
        AND products.business_id = get_user_business_id()
    )
  )
  WITH CHECK (
    is_admin() AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_branches.product_id
        AND products.business_id = get_user_business_id()
    )
  );

-- 4. record_sale actualizada: la venta guarda la sucursal de la caja
CREATE OR REPLACE FUNCTION record_sale(
  p_cash_register_id UUID,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_items JSONB
)
RETURNS TABLE (id UUID, number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
  v_sale_id UUID;
  v_sale_number INTEGER;
  v_branch_id UUID;
  item JSONB;
BEGIN
  v_user_id := auth.uid();
  SELECT business_id INTO v_business_id FROM profiles WHERE id = v_user_id;
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_cash_register_id IS NOT NULL THEN
    SELECT branch_id INTO v_branch_id FROM cash_registers WHERE id = p_cash_register_id;
  END IF;

  INSERT INTO sales (user_id, customer_id, cash_register_id, branch_id, subtotal, discount, tax, total, payment_method, status, business_id)
  VALUES (v_user_id, p_customer_id, p_cash_register_id, v_branch_id, p_subtotal, p_discount, p_tax, p_total, p_payment_method, 'completed', v_business_id)
  RETURNING sales.id, sales.number INTO v_sale_id, v_sale_number;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total)
    VALUES (
      v_sale_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC,
      0,
      (item->>'total')::NUMERIC
    );

    UPDATE products
    SET stock = GREATEST(stock - (item->>'quantity')::NUMERIC, 0),
        updated_at = NOW()
    WHERE id = (item->>'product_id')::UUID
      AND business_id = v_business_id;
  END LOOP;

  IF p_payment_method = 'cash' AND p_cash_register_id IS NOT NULL THEN
    INSERT INTO cash_movements (cash_register_id, type, amount, description, sale_id, user_id)
    VALUES (p_cash_register_id, 'sale_in', p_total, 'Venta #' || v_sale_number || ' - Efectivo', v_sale_id, v_user_id);
  END IF;

  RETURN QUERY SELECT v_sale_id, v_sale_number;
END;
$$;

-- 5. CAJEROS: crear cuenta con acceso limitado
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION admin_create_cashier(p_email TEXT, p_name TEXT, p_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_business UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT profiles.business_id INTO v_business
  FROM profiles WHERE profiles.id = auth.uid();
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'No tenés un comercio asociado';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(p_email)) THEN
    RAISE EXCEPTION 'Ese email ya está registrado';
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_name),
    NOW(),
    NOW()
  );

  UPDATE profiles
  SET role = 'cajero', business_id = v_business, name = p_name, updated_at = NOW()
  WHERE id = v_user_id;

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_remove_cashier(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target profiles%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT * INTO v_target FROM profiles WHERE profiles.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cajero no encontrado';
  END IF;
  IF v_target.role <> 'cajero' OR v_target.business_id <> get_user_business_id() THEN
    RAISE EXCEPTION 'No podés eliminar este usuario';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_create_cashier(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_cashier(UUID) TO authenticated;
