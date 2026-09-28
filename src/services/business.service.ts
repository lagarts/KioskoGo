import { supabase } from '../lib/supabase';
import type { Business, RubroType, Subscription, User } from '../types';

export interface BusinessInput {
  name?: string;
  rubro?: RubroType;
  phone?: string;
  email?: string;
  address?: string;
  cuit?: string;
}

export async function getBusiness(id: string): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Business) ?? null;
}

export async function updateBusiness(id: string, input: BusinessInput): Promise<void> {
  const { error } = await supabase.from('businesses').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getSubscription(businessId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Subscription) ?? null;
}

export async function listBusinessUsers(businessId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as User[];
}
