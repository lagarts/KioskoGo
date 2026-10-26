// KioskoGo - Webhook de Mercado Pago (Supabase Edge Function)
// Recibe notificaciones IPN/Webhooks y activa la suscripción del comercio.

import { createClient } from "npm:@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface Payment {
  id: string | number;
  status: string;
  external_reference: string | null;
}

async function fetchPayment(paymentId: string): Promise<Payment | null> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    console.error("MP payment fetch failed:", res.status);
    return null;
  }
  return await res.json();
}

async function activateSubscription(businessId: string, paymentId: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      business_id: businessId,
      status: "active",
      plan: "monthly",
      payment_provider: "mercadopago",
      payment_id: paymentId,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "business_id" }
  );
  if (error) {
    console.error("DB upsert error:", error);
    throw new Error(error.message);
  }
  console.log(`Subscription activated for business ${businessId} via MP payment ${paymentId}`);
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    // Verificación de salud
    return new Response("OK", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let paymentId: string | null = null;
    let topic: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      topic = body.type ?? body.topic ?? null;
      paymentId = body.data?.id ?? body["data.id"] ?? null;
    } else {
      const form = await req.formData();
      topic = (form.get("type") as string) ?? (form.get("topic") as string) ?? null;
      paymentId =
        (form.get("data.id") as string) ??
        (form.get("id") as string) ??
        null;
    }

    console.log(`MP webhook: topic=${topic} payment=${paymentId}`);

    if (topic === "payment" && paymentId) {
      const payment = await fetchPayment(paymentId);
      if (payment && payment.status === "approved" && payment.external_reference) {
        await activateSubscription(payment.external_reference, String(payment.id));
      } else if (payment) {
        console.log(`Payment status: ${payment.status}, not activating`);
      }
    }

    // Mercado Pago espera 200 siempre
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("mp-webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
