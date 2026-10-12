-- KioskoGo - Transferencias entre SUCURSALES (ejecutar en Supabase SQL Editor)
-- Vincula cada sucursal con su depósito (warehouse) y permite transferir entre sucursales.

-- 1. Cada sucursal queda ligada a un depósito propio
ALTER TABLE branches ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- 2. Backfill: crear depósito para las sucursales existentes que no tengan uno
DO $$
DECLARE
  b RECORD;
  v_wh UUID;
BEGIN
  FOR b IN SELECT id, name, address, business_id FROM branches WHERE warehouse_id IS NULL LOOP
    INSERT INTO warehouses (name, address, is_default, business_id)
    VALUES (b.name, b.address, false, b.business_id)
    RETURNING id INTO v_wh;
    UPDATE branches SET warehouse_id = v_wh WHERE id = b.id;
  END LOOP;
END $$;

-- 3. Función de transferencia entre sucursales
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

  IF p_quantity > v_stock THEN
    RAISE EXCEPTION 'No hay stock suficiente para transferir (disponible: %)', v_stock;
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

  RETURN (
    SELECT id FROM stock_transfers
    ORDER BY created_at DESC LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION record_transfer(uuid, uuid, uuid, numeric, text) TO authenticated;
