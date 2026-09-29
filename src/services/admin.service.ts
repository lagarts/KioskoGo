import { supabase } from '../lib/supabase';

export interface AdminUserRow {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  registered_at: string;
  business_name: string | null;
  sub_status: string | null;
  sub_plan: string | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  days_left: number | null;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminUserRow[];
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', { target: userId });
  if (error) throw new Error(error.message);
}

export async function adminGrantForever(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_grant_forever', { target: userId });
  if (error) throw new Error(error.message);
}
