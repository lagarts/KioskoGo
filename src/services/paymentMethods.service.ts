import { supabase } from '../lib/supabase';

export interface PaymentMethodItem {
  id: string;
  code: string;
  label: string;
}

export const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethodItem, 'id'>[] = [
  { code: 'cash', label: 'Efectivo' },
  { code: 'debit', label: 'Tarjeta Débito' },
  { code: 'credit', label: 'Tarjeta Crédito' },
  { code: 'transfer', label: 'Transferencia' },
  { code: 'mercadopago', label: 'Mercado Pago' },
  { code: 'account', label: 'Cuenta Corriente' },
];

export async function listPaymentMethods(): Promise<PaymentMethodItem[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('id, code, label')
    .order('created_at');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    return DEFAULT_PAYMENT_METHODS.map((m) => ({ ...m, id: `default-${m.code}` }));
  }
  return data as PaymentMethodItem[];
}

export async function ensureDefaultPaymentMethods(businessId: string): Promise<void> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('id')
    .limit(1);
  if (error) throw new Error(error.message);
  if (data && data.length > 0) return;

  const { error: insertError } = await supabase.from('payment_methods').insert(
    DEFAULT_PAYMENT_METHODS.map((m) => ({
      business_id: businessId,
      code: m.code,
      label: m.label,
    }))
  );
  if (insertError) throw new Error(insertError.message);
}

export async function createPaymentMethod(
  label: string,
  businessId: string
): Promise<PaymentMethodItem> {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({ business_id: businessId, code: crypto.randomUUID(), label })
    .select('id, code, label')
    .single();
  if (error) throw new Error(error.message);
  return data as PaymentMethodItem;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
