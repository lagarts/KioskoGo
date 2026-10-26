// KioskoGo - Crear preferencia de pago de Mercado Pago (Supabase Edge Function)
// Recibe el business_id y devuelve el init_point para redirigir al checkout.

import { createClient } from "npm:@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://kiosko-go.vercel.app";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { business_id } = await req.json();
    if (!business_id) {
      return json({ error: "Falta business_id" }, 400);
    }

    // Verificar que el usuario autenticado pertenece a ese comercio
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return json({ error: "No autorizado" }, 401);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile || profile.business_id !== business_id) {
      return json({ error: "No autorizado" }, 401);
    }

    const preference = {
      items: [
        {
          id: "kioskogo_monthly_ars",
          title: "Suscripción KioskoGo - Plan Mensual",
          quantity: 1,
          unit_price: 15000,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: userData.user.email,
      },
      external_reference: business_id,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      back_urls: {
        success: `${SITE_URL}/settings`,
        failure: `${SITE_URL}/settings`,
        pending: `${SITE_URL}/settings`,
      },
      auto_return: "approved",
      statement_descriptor: "KIOSKOGO",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("MP preference error:", res.status, errBody);
      return json({ error: "Error creando el pago" }, 502);
    }

    const data = await res.json();
    return json({ init_point: data.init_point, id: data.id });
  } catch (err) {
    console.error("mp-create-preference error:", err);
    return json({ error: "Error interno" }, 500);
  }
});
