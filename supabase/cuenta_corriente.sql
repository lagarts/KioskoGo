-- KioskoGo - Cuenta corriente (ejecutar en Supabase SQL Editor)

-- 1. record_sale: valida cliente para cuenta corriente y suma el total al saldo del cliente
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

  IF p_payment_method = 'account' AND p_customer_id IS NULL THEN
    RAISE EXCEPTION 'La cuenta corriente requiere seleccionar un cliente';
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

  IF p_payment_method = 'account' AND p_customer_id IS NOT NULL THEN
    UPDATE customers
    SET balance = balance + p_total
    WHERE id = p_customer_id
      AND business_id = v_business_id;
  END IF;

  IF p_payment_method = 'cash' AND p_cash_register_id IS NOT NULL THEN
    INSERT INTO cash_movements (cash_register_id, type, amount, description, sale_id, user_id)
    VALUES (p_cash_register_id, 'sale_in', p_total, 'Venta #' || v_sale_number || ' - Efectivo', v_sale_id, v_user_id);
  END IF;

  RETURN QUERY SELECT v_sale_id, v_sale_number;
END;
$$;

-- 2. Cobro a cuenta corriente: descuenta el saldo del cliente y,
--    si hay caja abierta, registra el ingreso en la caja
CREATE OR REPLACE FUNCTION pay_customer_balance(p_customer_id UUID, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
  v_new_balance NUMERIC;
  v_register_id UUID;
  v_customer_name TEXT;
BEGIN
  v_user_id := auth.uid();
  SELECT business_id INTO v_business_id FROM profiles WHERE id = v_user_id;
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  SELECT name INTO v_customer_name
  FROM customers
  WHERE id = p_customer_id AND business_id = v_business_id;
  IF v_customer_name IS NULL THEN
    RAISE EXCEPTION 'Cliente no encontrado';
  END IF;

  UPDATE customers
  SET balance = balance - p_amount
  WHERE id = p_customer_id
    AND business_id = v_business_id;

  SELECT balance INTO v_new_balance
  FROM customers
  WHERE id = p_customer_id;

  SELECT id INTO v_register_id
  FROM cash_registers
  WHERE business_id = v_business_id
    AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  IF v_register_id IS NOT NULL THEN
    INSERT INTO cash_movements (cash_register_id, type, amount, description, user_id)
    VALUES (v_register_id, 'sale_in', p_amount, 'Cobro cuenta corriente - ' || v_customer_name, v_user_id);
  END IF;

  RETURN v_new_balance;
END;
$$;
