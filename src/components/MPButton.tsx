import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MPButtonProps {
  onSuccess?: () => void;
}

export function MPButton({ onSuccess }: MPButtonProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClick = async () => {
    if (status === 'loading' || !user?.business_id) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const { data, error } = await supabase.functions.invoke('mp-create-preference', {
        body: { business_id: user.business_id },
      });
      if (error) {
        throw new Error(error.message ?? 'Error creando el pago');
      }
      if (!data?.init_point) {
        throw new Error(data?.error ?? 'No se pudo iniciar el pago');
      }
      onSuccess?.();
      window.location.href = data.init_point;
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo iniciar el pago');
    }
  };

  if (status === 'error') {
    return (
      <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg text-center">
        {errorMsg}
      </div>
    );
  }

  return (
    <button
      onClick={() => void handleClick()}
      disabled={status === 'loading' || !user?.business_id}
      className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
    >
      {status === 'loading' ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
    </button>
  );
}
