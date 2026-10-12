-- KioskoGo - Las ventas requieren caja abierta (ejecutar en Supabase SQL Editor)
-- Reemplaza record_sale: sin caja abierta no se puede registrar ninguna venta.

DROP FUNCTION IF EXISTS record_sale(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS record_sale(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, NUMERIC);

CREATE OR REPLACE FUNCTION record_sale(
  p_cash_register_id UUID,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_items JSONB,
  p_amount_paid NUMERIC DEFAULT 0
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
  SELECT business_id INTO v_business_id FROM profiles WHERE profiles.id = v_user_id;
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_cash_register_id IS NULL THEN
    RAISE EXCEPTION 'No hay caja abierta. Abrí la caja para cargar ventas.';
  END IF;

  IF p_payment_method = 'account' AND p_customer_id IS NULL THEN
    RAISE EXCEPTION 'La cuenta corriente requiere seleccionar un cliente';
  END IF;

  IF p_amount_paid IS NULL OR p_amount_paid < 0 THEN
    RAISE EXCEPTION 'El monto abonado no puede ser negativo';
  END IF;

  SELECT branch_id INTO v_branch_id
  FROM cash_registers
  WHERE cash_registers.id = p_cash_register_id
    AND cash_registers.business_id = v_business_id
    AND cash_registers.status = 'open';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La caja indicada no está abierta o no pertenece a tu comercio';
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
    WHERE products.id = (item->>'product_id')::UUID
      AND products.business_id = v_business_id;
  END LOOP;

  IF p_payment_method = 'account' AND p_customer_id IS NOT NULL THEN
    UPDATE customers
    SET balance = balance + (p_total - p_amount_paid)
    WHERE customers.id = p_customer_id
      AND customers.business_id = v_business_id;
  END IF;

  IF p_payment_method = 'cash' THEN
    INSERT INTO cash_movements (cash_register_id, type, amount, description, sale_id, user_id)
    VALUES (p_cash_register_id, 'sale_in', p_total, 'Venta #' || v_sale_number || ' - Efectivo', v_sale_id, v_user_id);
  END IF;

  IF p_payment_method = 'account' AND p_amount_paid > 0 THEN
    INSERT INTO cash_movements (cash_register_id, type, amount, description, sale_id, user_id)
    VALUES (p_cash_register_id, 'sale_in', p_amount_paid, 'Venta #' || v_sale_number || ' - Abono cuenta corriente', v_sale_id, v_user_id);
  END IF;

  RETURN QUERY SELECT v_sale_id, v_sale_number;
END;
$$;
