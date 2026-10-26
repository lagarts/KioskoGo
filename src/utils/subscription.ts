import type { Subscription } from '../types';

export interface SubscriptionAccess {
  blocked: boolean;
  /** Título del motivo del bloqueo */
  reason: string;
  /** Detalle adicional (fecha de vencimiento, etc.) */
  detail?: string;
}

/**
 * Determina si la suscripción del comercio permite operar (abrir caja, etc.).
 * Bloquea si no hay suscripción, si el estado es impago/vencido/cancelado,
 * o si el período de prueba o el período pago ya vencieron.
 */
export function checkSubscriptionAccess(sub: Subscription | null): SubscriptionAccess {
  if (!sub) {
    return {
      blocked: true,
      reason: 'Sin suscripción activa',
      detail: 'Para usar KioskoGo necesitás abonar la suscripción mensual.',
    };
  }

  const notPaid = ['past_due', 'expired', 'cancelled', 'blocked'];
  if (notPaid.includes(sub.status)) {
    return {
      blocked: true,
      reason: 'Suscripción impaga',
      detail: 'Tu suscripción está vencida o cancelada. Abrí la sección Suscripción para pagar.',
    };
  }

  if (sub.status === 'trial') {
    if (sub.trial_end && new Date(sub.trial_end).getTime() < Date.now()) {
      return {
        blocked: true,
        reason: 'Período de prueba terminado',
        detail: `El período de prueba venció el ${new Date(sub.trial_end).toLocaleDateString('es-AR')}.`,
      };
    }
    return { blocked: false, reason: '' };
  }

  if (sub.status === 'active') {
    if (
      sub.current_period_end &&
      new Date(sub.current_period_end).getTime() < Date.now()
    ) {
      return {
        blocked: true,
        reason: 'Suscripción vencida',
        detail: `Tu período pagado venció el ${new Date(sub.current_period_end).toLocaleDateString('es-AR')}.`,
      };
    }
    return { blocked: false, reason: '' };
  }

  // Estados desconocidos: no bloquear
  return { blocked: false, reason: '' };
}
