import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const PAYPAL_CLIENT_ID =
  'BAAMjXwj_wR5OKM_Xc_KuoBKbZC4JYP5FO7gArJGCTTRVlmNoBNfV7YPMWQlInxaSQVf6dHSjI4rNKs00M';
const PLAN_AMOUNT = '10.00';
const PLAN_CURRENCY = 'USD';

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: (
          data: Record<string, unknown>,
          actions: {
            order: {
              create: (input: {
                purchase_units: { amount: { value: string; currency_code: string } }[];
              }) => Promise<string>;
            };
          }
        ) => Promise<string>;
        onApprove: (
          data: Record<string, unknown>,
          actions: {
            order: {
              capture: () => Promise<{ id: string; status: string }>;
            };
          }
        ) => Promise<void>;
        onError: (err: unknown) => void;
        style?: { color?: string; shape?: string; label?: string; height?: number };
      }) => { render: (selector: string) => void };
    };
  }
}

function loadPaypalScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Error cargando PayPal')));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=buttons&currency=${PLAN_CURRENCY}`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error cargando PayPal'));
    document.body.appendChild(script);
  });
}

interface PayPalButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function PayPalButton({ onSuccess, onError }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadPaypalScript();
        if (cancelled || !containerRef.current || !window.paypal) return;

        window.paypal.Buttons({
          style: { color: 'blue', shape: 'rect', label: 'pay', height: 45 },
          createOrder: (_data, actions) =>
            actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: PLAN_AMOUNT,
                    currency_code: PLAN_CURRENCY,
                  },
                },
              ],
            }),
          onApprove: async (_data, actions) => {
            const details = await actions.order.capture();
            if (details.status !== 'COMPLETED') {
              setError('El pago no se completó');
              onError?.('El pago no se completó');
              return;
            }
            const { error: rpcError } = await supabase.rpc('activate_subscription_paypal', {
              p_payment_id: details.id,
            });
            if (rpcError) {
              setError(rpcError.message);
              onError?.(rpcError.message);
              return;
            }
            setPaid(true);
            onSuccess?.();
          },
          onError: (err) => {
            const msg =
              err instanceof Error ? err.message : 'Hubo un error procesando el pago con PayPal';
            setError(msg);
            onError?.(msg);
          },
        });
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando PayPal');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (paid) {
    return (
      <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg text-center">
        ¡Pago realizado con éxito! Tu suscripción quedó activa.
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <div>
      {loading && <p className="text-sm text-surface-400 text-center py-2">Cargando PayPal...</p>}
      <div ref={containerRef} />
    </div>
  );
}
