import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const PAYPAL_CLIENT_ID =
  'BAAMjXwj_wR5OKM_Xc_KuoBKbZC4JYP5FO7gArJGCTTRVlmNoBNfV7YPMWQlInxaSQVf6dHSjI4rNKs00M';
const HOSTED_BUTTON_ID = 'F5QJ3NFVJCY7Q';

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (options: { hostedButtonId: string }) => {
        render: (selector: string) => void;
      };
      Buttons?: unknown;
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
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar PayPal'));
    document.head.appendChild(script);
  });
}

interface PayPalButtonProps {
  onSuccess?: () => void;
}

export function PayPalButton({ onSuccess }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadPaypalSdk();
        if (cancelled) return;
        if (!window.paypal?.HostedButtons) {
          setStatus('error');
          setErrorMsg('El SDK de PayPal no cargó. Recargá la página.');
          return;
        }
        const containerId = `paypal-hosted-${Date.now()}`;
        if (containerRef.current) {
          containerRef.current.id = containerId;
        }
        window.paypal.HostedButtons({ hostedButtonId: HOSTED_BUTTON_ID }).render(`#${containerId}`);
        setStatus('ready');
        onSuccess?.();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Error cargando PayPal');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
