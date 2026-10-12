-- KioskoGo - Anular venta (ejecutar en Supabase SQL Editor)
-- Restaura stock, ajusta saldo de cuenta corriente y registra el egreso de caja.

CREATE OR REPLACE FUNCTION cancel_sale(p_sale_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale sales%ROWTYPE;
  v_business UUID;
  v_paid NUMERIC;
  item RECORD;
BEGIN
  SELECT business_id INTO v_business FROM profiles WHERE profiles.id = auth.uid();
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'encargado')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT * INTO v_sale FROM sales WHERE sales.id = p_sale_id AND sales.business_id = v_business;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF v_sale.status = 'cancelled' THEN
    RAISE EXCEPTION 'La venta ya estaba anulada';
  END IF;

  UPDATE sales SET status = 'cancelled' WHERE sales.id = p_sale_id;

  FOR item IN
    SELECT sale_items.product_id, sale_items.quantity
    FROM sale_items
    WHERE sale_items.sale_id = p_sale_id
  LOOP
    UPDATE products
    SET stock = stock + item.quantity,
        updated_at = NOW()
    WHERE products.id = item.product_id
      AND products.business_id = v_business;
  END LOOP;

  IF v_sale.payment_method = 'account' AND v_sale.customer_id IS NOT NULL THEN
    SELECT COALESCE(SUM(cash_movements.amount), 0) INTO v_paid
    FROM cash_movements
    WHERE cash_movements.sale_id = p_sale_id
      AND cash_movements.type = 'sale_in';

    UPDATE customers
    SET balance = balance - (v_sale.total - v_paid)
    WHERE customers.id = v_sale.customer_id
      AND customers.business_id = v_business;
  END IF;

  IF v_sale.cash_register_id IS NOT NULL THEN
    INSERT INTO cash_movements (cash_register_id, type, amount, description, sale_id, user_id)
    VALUES (
      v_sale.cash_register_id,
      'sale_out',
      v_sale.total,
      'Anulación Venta #' || v_sale.number,
      p_sale_id,
      auth.uid()
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_sale(uuid) TO authenticated;
