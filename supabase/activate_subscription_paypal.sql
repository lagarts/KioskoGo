-- KioskoGo - Activar suscripción tras pago con PayPal (ejecutar en Supabase SQL Editor)
-- Se llama desde el frontend después de capturar el pago (onApprove).

CREATE OR REPLACE FUNCTION activate_subscription_paypal(p_payment_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business UUID;
BEGIN
  SELECT business_id INTO v_business FROM profiles WHERE profiles.id = auth.uid();
  IF v_business IS NULL THEN
    RAISE EXCEPTION 'El usuario no tiene un comercio asociado';
  END IF;

  IF p_payment_id IS NULL OR TRIM(p_payment_id) = '' THEN
    RAISE EXCEPTION 'Falta el identificador del pago';
  END IF;

  UPDATE subscriptions
  SET status = 'active',
      plan = 'monthly',
      payment_provider = 'paypal',
      payment_id = p_payment_id,
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '1 month',
      trial_end = GREATEST(COALESCE(trial_end, NOW()), NOW())
  WHERE business_id = v_business;

  IF NOT FOUND THEN
    INSERT INTO subscriptions (
      business_id, status, plan, payment_provider, payment_id,
      current_period_start, current_period_end
    ) VALUES (
      v_business, 'active', 'monthly', 'paypal', p_payment_id,
      NOW(), NOW() + INTERVAL '1 month'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION activate_subscription_paypal(text) TO authenticated;
