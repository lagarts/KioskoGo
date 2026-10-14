import { useEffect, useRef, useState } from 'react';

const PAYPAL_CLIENT_ID =
  'BAA_86nNbjR8acEiDITrJDpa9UsUJIgyD4iQA55ho-V0x8P0X3dTmQIj7x6h2o8XFpeEmrghx6uahH-CkE';
const HOSTED_BUTTON_ID = 'SJYTR2QNVLN9E';

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (options: { hostedButtonId: string }) => {
        render: (selector: string) => void;
      };
    };
  }
}

function loadPaypalSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.paypal?.HostedButtons) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk]');
    if (existing) {
      if (window.paypal?.HostedButtons) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar PayPal')));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => {
      if (window.paypal?.HostedButtons) resolve();
      else reject(new Error('El SDK de PayPal no inicializó. Verificá el client-id.'));
    };
    script.onerror = () => reject(new Error('No se pudo cargar PayPal. Revisá tu conexión.'));
    document.head.appendChild(script);
  });
}

export function PayPalButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    let renderTimeout: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        await Promise.race([
          loadPaypalSdk(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PayPal tardó demasiado. Recargá la página.')), 15000)
          ),
        ]);
        if (cancelled || !containerRef.current) return;
        if (!window.paypal?.HostedButtons) {
          setStatus('error');
          setErrorMsg('El SDK de PayPal no inicializó. Verificá el client-id.');
          return;
        }

        const containerId = `paypal-hosted-${Date.now()}`;
        containerRef.current.id = containerId;
        window.paypal.HostedButtons({ hostedButtonId: HOSTED_BUTTON_ID }).render(`#${containerId}`);
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
  }, []);

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
