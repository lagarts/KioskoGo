// KioskoGo - Webhook de PayPal (Supabase Edge Function)
// Recibe notificaciones de PayPal y activa suscripciones.

import { createClient } from "npm:@supabase/supabase-js@2";

const PAYPAL_API = "https://api-m.paypal.com";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";
const WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function getAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function verifyWebhook(headers: Headers, body: string): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

function extractBusinessId(event: Record<string, unknown>): string | null {
  const resource = event.resource as Record<string, unknown> | undefined;
  if (!resource) return null;

  const custom = resource.custom as string | undefined;
  if (custom) return custom;

  const purchaseUnits = resource.purchase_units as
    | Record<string, unknown>[]
    | undefined;
  if (purchaseUnits && purchaseUnits.length > 0) {
    const unitCustom = purchaseUnits[0].custom as string | undefined;
    if (unitCustom) return unitCustom;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();

    const isValid = await verifyWebhook(req.headers, body);
    if (!isValid) {
      console.error("Webhook verification failed");
      return new Response("Verification failed", { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type as string;

    console.log(`PayPal webhook: ${eventType}`);

    if (
      eventType === "PAYMENT.CAPTURE.COMPLETED" ||
      eventType === "CHECKOUT.ORDER.APPROVED"
    ) {
      const businessId = extractBusinessId(event);
      if (businessId) {
        const paymentId =
          (event.resource as Record<string, unknown>)?.id as string ?? "";

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabase
          .from("subscriptions")
          .upsert(
            {
              business_id: businessId,
              status: "active",
              plan: "monthly",
              payment_provider: "paypal",
              payment_id: paymentId,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            { onConflict: "business_id" }
          );

        if (error) {
          console.error("Error activating subscription:", error);
          return new Response("DB error", { status: 500 });
        }

        console.log(`Subscription activated for business: ${businessId}`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
