-- KioskoGo - SQL complementario (ejecutar en Supabase SQL Editor)

-- 1. Función atómica para registrar ventas:
--    crea la venta, sus ítems, descuenta stock y registra el movimiento de caja.
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
  item JSONB;
BEGIN
  v_user_id := auth.uid();
  SELECT business_id INTO v_business_id FROM profiles WHERE id = v_user_id;
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  INSERT INTO sales (user_id, customer_id, cash_register_id, subtotal, discount, tax, total, payment_method, status, business_id)
  VALUES (v_user_id, p_customer_id, p_cash_register_id, p_subtotal, p_discount, p_tax, p_total, p_payment_method, 'completed', v_business_id)
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

-- 2. Policies adicionales
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view business users" ON profiles;
CREATE POLICY "Admins can view business users" ON profiles
  FOR SELECT USING (business_id = get_user_business_id() AND is_admin());

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

-- 3. (OPCIONAL) Vincular tu usuario al comercio de ejemplo con productos precargados.
--    Reemplazá 'TU_EMAIL' por el email con el que ingresás a la app.
--    Si NO ejecutás esto, la app creará un comercio nuevo y vacío en el primer ingreso.
-- UPDATE profiles SET business_id = 'a0000000-0000-4000-8000-000000000001' WHERE email = 'TU_EMAIL' AND business_id IS NULL;
