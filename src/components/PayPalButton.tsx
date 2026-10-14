import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PAYPAL_CLIENT_ID =
  'BAA_86nNbjR8acEiDITrJDpa9UsUJIgyD4iQA55ho-V0x8P0X3dTmQIj7x6h2o8XFpeEmrghx6uahH-CkE';
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
                purchase_units: {
                  amount: { value: string; currency_code: string };
                  custom?: string;
                  description?: string;
                }[];
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
    if (window.paypal?.Buttons) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk]');
    if (existing) {
      if (window.paypal?.Buttons) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar PayPal')));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&components=buttons&currency=${PLAN_CURRENCY}`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => {
      if (window.paypal?.Buttons) resolve();
      else reject(new Error('El SDK de PayPal no inicializó. Verificá el client-id.'));
    };
    script.onerror = () => reject(new Error('No se pudo cargar PayPal. Revisá tu conexión.'));
    document.head.appendChild(script);
  });
}

interface PayPalButtonProps {
  onSuccess?: () => void;
}

export function PayPalButton({ onSuccess }: PayPalButtonProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'paid'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    let renderTimeout: ReturnType<typeof setTimeout> | undefined;
    const businessId = user?.business_id;

    (async () => {
      try {
        await Promise.race([
          loadPaypalScript(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PayPal tardó demasiado. Recargá la página.')), 15000)
          ),
        ]);
        if (cancelled || !containerRef.current) return;
        if (!window.paypal?.Buttons) {
          setStatus('error');
          setErrorMsg('El SDK de PayPal no inicializó. Verificá el client-id.');
          return;
        }

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
                  custom: businessId ?? '',
                  description: 'Suscripción KioskoGo - Plan Mensual USD',
                },
              ],
            }),
          onApprove: async (_data, actions) => {
            try {
              const details = await actions.order.capture();
              if (details.status !== 'COMPLETED') {
                setStatus('error');
                setErrorMsg('El pago no se completó. Intentá de nuevo.');
                return;
              }
              setStatus('paid');
              onSuccess?.();
            } catch (err) {
              setStatus('error');
              setErrorMsg(err instanceof Error ? err.message : 'Error procesando el pago');
            }
          },
          onError: (err) => {
            if (cancelled) return;
            setStatus('error');
            setErrorMsg(
              err instanceof Error ? err.message : 'Hubo un error con PayPal. Intentá de nuevo.'
            );
          },
        });

        if (cancelled) return;
        setStatus('ready');

        renderTimeout = setTimeout(() => {
          const el = containerRef.current;
          if (el && el.childElementCount === 0) {
            setStatus('error');
            setErrorMsg('El botón de PayPal no se pudo renderizar. Recargá la página.');
          }
        }, 5000);
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Error cargando PayPal');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (renderTimeout) clearTimeout(renderTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.business_id]);

  if (status === 'paid') {
    return (
      <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg text-center">
        ¡Pago realizado con éxito! Tu suscripción se activará en unos segundos.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg text-center">
        {errorMsg}
      </div>
    );
  }

  return (
    <div>
      {status === 'loading' && (
        <p className="text-sm text-surface-400 text-center py-2">Cargando botón de PayPal...</p>
      )}
      <div ref={containerRef} className="min-h-[50px]" />
    </div>
  );
}
