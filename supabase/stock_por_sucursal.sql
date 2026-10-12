-- KioskoGo - Stock por sucursal (ejecutar en Supabase SQL Editor)
-- Agrega columna stock a product_branches y mantiene el desglose por sucursal.

-- 1. Columna de stock por sucursal
ALTER TABLE product_branches ADD COLUMN IF NOT EXISTS stock NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 2. Backfill: el stock actual pasa a la primera sucursal activa de cada comercio
DO $$
DECLARE
  p RECORD;
  v_first_branch UUID;
BEGIN
  FOR p IN SELECT id, stock, business_id FROM products WHERE active = true LOOP
    SELECT id INTO v_first_branch
    FROM branches
    WHERE business_id = p.business_id AND active = true
    ORDER BY created_at
    LIMIT 1;

    IF v_first_branch IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO product_branches (product_id, branch_id, stock)
    VALUES (p.id, v_first_branch, p.stock)
    ON CONFLICT (product_id, branch_id) DO UPDATE SET stock = EXCLUDED.stock;

    UPDATE product_branches
    SET stock = 0
    WHERE product_id = p.id
      AND branch_id <> v_first_branch;
  END LOOP;
END $$;

-- 3. record_sale: descuenta stock de la sucursal de la caja
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

    IF v_branch_id IS NOT NULL THEN
      INSERT INTO product_branches (product_id, branch_id, stock)
      VALUES ((item->>'product_id')::UUID, v_branch_id, GREATEST(-(item->>'quantity')::NUMERIC, -1 * ((item->>'quantity')::NUMERIC)))
      ON CONFLICT (product_id, branch_id)
      DO UPDATE SET stock = GREATEST(product_branches.stock - (item->>'quantity')::NUMERIC, 0);
    END IF;
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

GRANT EXECUTE ON FUNCTION record_sale(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, NUMERIC) TO authenticated;

-- 4. record_purchase: suma stock a la sucursal elegida (o a la primera si no se indica)
DROP FUNCTION IF EXISTS record_purchase(UUID, TEXT, JSONB, BOOLEAN);
DROP FUNCTION IF EXISTS record_purchase(UUID, TEXT, JSONB, BOOLEAN, UUID);

CREATE OR REPLACE FUNCTION record_purchase(
  p_supplier_id UUID,
  p_notes TEXT,
  p_items JSONB,
  p_received BOOLEAN DEFAULT TRUE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business UUID;
  v_user UUID;
  v_purchase_id UUID;
  v_number INTEGER;
  v_subtotal NUMERIC := 0;
  v_received BOOLEAN := COALESCE(p_received, TRUE);
  v_branch UUID;
  item RECORD;
BEGIN
  v_user := auth.uid();
  SELECT business_id INTO v_business FROM profiles WHERE profiles.id = v_user;
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Agregá al menos un producto';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF (item->>'quantity')::NUMERIC <= 0 OR (item->>'unit_cost')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'Cantidad y costo deben ser válidos';
    END IF;
    v_subtotal := v_subtotal + (item->>'quantity')::NUMERIC * (item->>'unit_cost')::NUMERIC;
  END LOOP;

  v_branch := p_branch_id;
  IF v_branch IS NULL THEN
    SELECT id INTO v_branch
    FROM branches
    WHERE business_id = v_business AND active = true
    ORDER BY created_at
    LIMIT 1;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM branches WHERE branches.id = v_branch AND branches.business_id = v_business
    ) THEN
      RAISE EXCEPTION 'Sucursal no encontrada';
    END IF;
  END IF;

  INSERT INTO purchases (supplier_id, user_id, subtotal, discount, tax, total, status, notes, business_id)
  VALUES (
    p_supplier_id,
    v_user,
    v_subtotal,
    0,
    0,
    v_subtotal,
    CASE WHEN v_received THEN 'received' ELSE 'pending' END,
    NULLIF(TRIM(COALESCE(p_notes, '')), ''),
    v_business
  )
  RETURNING purchases.id, purchases.number INTO v_purchase_id, v_number;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, total)
    VALUES (
      v_purchase_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'unit_cost')::NUMERIC,
      (item->>'quantity')::NUMERIC * (item->>'unit_cost')::NUMERIC
    );

    IF v_received THEN
      UPDATE products
      SET stock = stock + (item->>'quantity')::NUMERIC,
          cost = (item->>'unit_cost')::NUMERIC,
          updated_at = NOW()
      WHERE products.id = (item->>'product_id')::UUID
        AND products.business_id = v_business;

      IF v_branch IS NOT NULL THEN
        INSERT INTO product_branches (product_id, branch_id, stock)
        VALUES ((item->>'product_id')::UUID, v_branch, (item->>'quantity')::NUMERIC)
        ON CONFLICT (product_id, branch_id)
        DO UPDATE SET stock = product_branches.stock + (item->>'quantity')::NUMERIC;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_purchase_id, v_number;
END;
$$;

GRANT EXECUTE ON FUNCTION record_purchase(uuid, text, jsonb, boolean, uuid) TO authenticated;

-- 5. cancel_sale: devuelve stock a la sucursal de la venta
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

    IF v_sale.branch_id IS NOT NULL THEN
      INSERT INTO product_branches (product_id, branch_id, stock)
      VALUES (item.product_id, v_sale.branch_id, item.quantity)
      ON CONFLICT (product_id, branch_id)
      DO UPDATE SET stock = product_branches.stock + item.quantity;
    END IF;
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

-- 6. record_transfer: mueve stock entre sucursales en product_branches
DROP FUNCTION IF EXISTS record_transfer(uuid, uuid, uuid, numeric, text);

CREATE OR REPLACE FUNCTION record_transfer(
  p_product_id UUID,
  p_from_branch UUID,
  p_to_branch UUID,
  p_quantity NUMERIC,
  p_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business UUID;
  v_user UUID;
  v_from_wh UUID;
  v_to_wh UUID;
  v_stock NUMERIC;
  v_product_name TEXT;
BEGIN
  v_user := auth.uid();
  SELECT business_id INTO v_business FROM profiles WHERE profiles.id = v_user;
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_from_branch = p_to_branch THEN
    RAISE EXCEPTION 'Las sucursales de origen y destino deben ser distintas';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  SELECT warehouse_id INTO v_from_wh
  FROM branches WHERE branches.id = p_from_branch AND branches.business_id = v_business;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sucursal de origen no encontrada';
  END IF;

  SELECT warehouse_id INTO v_to_wh
  FROM branches WHERE branches.id = p_to_branch AND branches.business_id = v_business;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sucursal de destino no encontrada';
  END IF;

  IF v_from_wh IS NULL THEN
    INSERT INTO warehouses (name, is_default, business_id)
    SELECT name, false, business_id FROM branches WHERE branches.id = p_from_branch
    RETURNING id INTO v_from_wh;
    UPDATE branches SET warehouse_id = v_from_wh WHERE branches.id = p_from_branch;
  END IF;

  IF v_to_wh IS NULL THEN
    INSERT INTO warehouses (name, is_default, business_id)
    SELECT name, false, business_id FROM branches WHERE branches.id = p_to_branch
    RETURNING id INTO v_to_wh;
    UPDATE branches SET warehouse_id = v_to_wh WHERE branches.id = p_to_branch;
  END IF;

  SELECT products.stock, products.name INTO v_stock, v_product_name
  FROM products
  WHERE products.id = p_product_id AND products.business_id = v_business;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  -- Validar stock en la sucursal de origen
  SELECT stock INTO v_stock
  FROM product_branches
  WHERE product_id = p_product_id AND branch_id = p_from_branch;

  IF v_stock IS NULL OR v_stock < p_quantity THEN
    RAISE EXCEPTION 'No hay stock suficiente en la sucursal de origen (disponible: %)', COALESCE(v_stock, 0);
  END IF;

  INSERT INTO stock_transfers (
    from_warehouse_id, to_warehouse_id, product_id, quantity, status, notes, user_id, business_id
  ) VALUES (
    v_from_wh, v_to_wh, p_product_id, p_quantity, 'completed',
    NULLIF(TRIM(COALESCE(p_notes, '')), ''), v_user, v_business
  );

  INSERT INTO stock_movements (product_id, warehouse_id, type, quantity, reference, notes, user_id)
  VALUES (p_product_id, v_from_wh, 'transfer_out', p_quantity,
          'Transferencia saliente', v_product_name, v_user);

  INSERT INTO stock_movements (product_id, warehouse_id, type, quantity, reference, notes, user_id)
  VALUES (p_product_id, v_to_wh, 'transfer_in', p_quantity,
          'Transferencia entrante', v_product_name, v_user);

  -- Mover stock entre sucursales
  UPDATE product_branches
  SET stock = stock - p_quantity
  WHERE product_id = p_product_id AND branch_id = p_from_branch;

  INSERT INTO product_branches (product_id, branch_id, stock)
  VALUES (p_product_id, p_to_branch, p_quantity)
  ON CONFLICT (product_id, branch_id)
  DO UPDATE SET stock = product_branches.stock + p_quantity;

  RETURN (
    SELECT id FROM stock_transfers
    ORDER BY created_at DESC LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION record_transfer(uuid, uuid, uuid, numeric, text) TO authenticated;
