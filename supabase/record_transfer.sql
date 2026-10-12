-- KioskoGo - Transferencias entre depósitos (ejecutar en Supabase SQL Editor)
-- Registra el movimiento entre depósitos. El stock total del producto no cambia.

CREATE OR REPLACE FUNCTION record_transfer(
  p_product_id UUID,
  p_from_warehouse UUID,
  p_to_warehouse UUID,
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
  v_transfer_id UUID;
  v_stock NUMERIC;
  v_product_name TEXT;
BEGIN
  v_user := auth.uid();
  SELECT business_id INTO v_business FROM profiles WHERE profiles.id = v_user;
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_from_warehouse = p_to_warehouse THEN
    RAISE EXCEPTION 'Los depósitos de origen y destino deben ser distintos';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM warehouses
    WHERE warehouses.id = p_from_warehouse AND warehouses.business_id = v_business
  ) THEN
    RAISE EXCEPTION 'Depósito de origen no encontrado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM warehouses
    WHERE warehouses.id = p_to_warehouse AND warehouses.business_id = v_business
  ) THEN
    RAISE EXCEPTION 'Depósito de destino no encontrado';
  END IF;

  SELECT products.stock, products.name INTO v_stock, v_product_name
  FROM products
  WHERE products.id = p_product_id AND products.business_id = v_business;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  IF p_quantity > v_stock THEN
    RAISE EXCEPTION 'No hay stock suficiente para transferir (disponible: %)', v_stock;
  END IF;

  INSERT INTO stock_transfers (
    from_warehouse_id, to_warehouse_id, product_id, quantity, status, notes, user_id, business_id
  ) VALUES (
    p_from_warehouse, p_to_warehouse, p_product_id, p_quantity, 'completed',
    NULLIF(TRIM(COALESCE(p_notes, '')), ''), v_user, v_business
  )
  RETURNING stock_transfers.id INTO v_transfer_id;

  INSERT INTO stock_movements (product_id, warehouse_id, type, quantity, reference, notes, user_id)
  VALUES (p_product_id, p_from_warehouse, 'transfer_out', p_quantity,
          'Transferencia saliente', v_product_name, v_user);

  INSERT INTO stock_movements (product_id, warehouse_id, type, quantity, reference, notes, user_id)
  VALUES (p_product_id, p_to_warehouse, 'transfer_in', p_quantity,
          'Transferencia entrante', v_product_name, v_user);

  RETURN v_transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_transfer(uuid, uuid, uuid, numeric, text) TO authenticated;
