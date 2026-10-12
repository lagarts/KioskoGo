import { supabase } from '../lib/supabase';

export type PaymentMethodKind = 'cobro' | 'pago';

export interface PaymentMethodItem {
  id: string;
  code: string;
  label: string;
  kind: PaymentMethodKind;
}

export const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethodItem, 'id'>[] = [
  { code: 'cash', label: 'Efectivo', kind: 'cobro' },
  { code: 'debit', label: 'Débito', kind: 'cobro' },
  { code: 'credit', label: 'Crédito', kind: 'cobro' },
  { code: 'transfer', label: 'Transferencia', kind: 'cobro' },
  { code: 'mercadopago', label: 'QR', kind: 'cobro' },
  { code: 'account', label: 'Cuenta Corriente', kind: 'cobro' },
];

export async function listPaymentMethods(): Promise<PaymentMethodItem[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('id, code, label, kind')
    .order('created_at');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    return DEFAULT_PAYMENT_METHODS.map((m) => ({ ...m, id: `default-${m.code}` }));
  }
  return (data as Omit<PaymentMethodItem, 'kind'>[]).map((m) => ({
    ...m,
    kind: (m as PaymentMethodItem).kind ?? 'cobro',
  }));
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
      kind: m.kind,
    }))
  );
  if (insertError) throw new Error(insertError.message);
}

export async function createPaymentMethod(
  label: string,
  businessId: string,
  kind: PaymentMethodKind
): Promise<PaymentMethodItem> {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({ business_id: businessId, code: crypto.randomUUID(), label, kind })
    .select('id, code, label, kind')
    .single();
  if (error) throw new Error(error.message);
  return data as PaymentMethodItem;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
