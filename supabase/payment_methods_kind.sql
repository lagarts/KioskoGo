-- KioskoGo - Métodos de pago: tipo cobro/pago (ejecutar en Supabase SQL Editor)
-- Si todavía NO ejecutaste supabase/payment_methods.sql, corré esa primero.

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'cobro';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'payment_methods'::regclass
      AND pg_get_constraintdef(oid) LIKE '%kind%'
  ) THEN
    ALTER TABLE payment_methods
      ADD CONSTRAINT payment_methods_kind_check CHECK (kind IN ('cobro', 'pago'));
  END IF;
END $$;

-- Nombres por defecto iguales a los del panel
UPDATE payment_methods SET label = 'Efectivo' WHERE code = 'cash';
UPDATE payment_methods SET label = 'Débito' WHERE code = 'debit';
UPDATE payment_methods SET label = 'Crédito' WHERE code = 'credit';
UPDATE payment_methods SET label = 'Transferencia' WHERE code = 'transfer';
UPDATE payment_methods SET label = 'QR' WHERE code = 'mercadopago';
UPDATE payment_methods SET label = 'Cuenta Corriente' WHERE code = 'account';
