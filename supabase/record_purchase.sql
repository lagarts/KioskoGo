-- KioskoGo - Registrar compras (ejecutar en Supabase SQL Editor)
-- Crea la compra con sus ítems; si está recibida suma stock y actualiza el costo.

CREATE OR REPLACE FUNCTION record_purchase(
  p_supplier_id UUID,
  p_notes TEXT,
  p_items JSONB,
  p_received BOOLEAN DEFAULT TRUE
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
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_purchase_id, v_number;
END;
$$;

GRANT EXECUTE ON FUNCTION record_purchase(uuid, text, jsonb, boolean) TO authenticated;
