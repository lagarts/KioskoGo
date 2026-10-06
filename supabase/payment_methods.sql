-- KioskoGo - Métodos de pago configurables (ejecutar en Supabase SQL Editor)

-- 1. Tabla de métodos de pago por comercio
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, code)
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;
CREATE POLICY "Users can view payment methods" ON payment_methods
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can insert payment methods" ON payment_methods;
CREATE POLICY "Users can insert payment methods" ON payment_methods
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can delete payment methods" ON payment_methods;
CREATE POLICY "Users can delete payment methods" ON payment_methods
  FOR DELETE USING (business_id = get_user_business_id());

-- 2. Liberar el CHECK de sales.payment_method para aceptar métodos nuevos
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'sales'::regclass
    AND pg_get_constraintdef(oid) LIKE '%payment_method%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE sales DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;
