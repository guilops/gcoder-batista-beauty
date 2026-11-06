import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  bookingServices,
  receiptMaxBytes,
  receiptMimeTypes,
} from "../_shared/service-catalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const unavailableBookingMessage =
  "Essa data ou horário não está mais disponível para agendamento. Escolha outra data ou horário.";

type BookingRequest = {
  customer_name?: unknown;
  customer_phone?: unknown;
  customer_email?: unknown;
  service?: unknown;
  details?: unknown;
  booking_date?: unknown;
  booking_time?: unknown;
  payment_method?: unknown;
  receipt?: unknown;
  website?: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function calculateDepositCents(priceCents: number) {
  return Math.floor(priceCents / 200) * 100;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  let body: BookingRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Não foi possível ler o pedido de agendamento." }, 400);
  }

  if (body.website) return jsonResponse({ error: "Não foi possível validar o pedido." }, 400);
  const name = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const phone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
  const email = typeof body.customer_email === "string" ? body.customer_email.trim() : "";
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  const date = typeof body.booking_date === "string" ? body.booking_date : "";
  const time = typeof body.booking_time === "string" ? body.booking_time : "";
  const paymentMethod = body.payment_method;
  const catalogItem = Object.entries(bookingServices).find(([name]) => name === service)?.[1];
  const receipt = isRecord(body.receipt) ? body.receipt : null;
  const receiptMimeType = typeof receipt?.mimeType === "string"
    ? Object.entries(receiptMimeTypes).find(([mimeType]) => mimeType === receipt.mimeType)
    : undefined;
  const receiptContent = typeof receipt?.content === "string" ? receipt.content : "";
  const receiptPadding = receiptContent.endsWith("==") ? 2 : receiptContent.endsWith("=") ? 1 : 0;
  const receiptByteLength = (receiptContent.length / 4) * 3 - receiptPadding;
  if (
    name.length < 2 || name.length > 100 ||
    phone.replace(/\D/g, "").length < 10 || phone.length > 30 ||
    email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !catalogItem || details.length > 1200 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValidSlot(time)
  ) {
    return jsonResponse({ error: "Confira os dados e o horário escolhido e tente novamente." }, 400);
  }
  if (paymentMethod !== "pix" && paymentMethod !== "credit_card") {
    return jsonResponse({ error: "Escolha Pix ou cartão de crédito como forma de pagamento." }, 400);
  }
  if (
    !receiptMimeType || !receiptContent ||
    receiptContent.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(receiptContent) ||
    receiptByteLength < 1 || receiptByteLength > receiptMaxBytes
  ) {
    return jsonResponse({ error: "Anexe um comprovante JPG, PNG, WEBP ou PDF de até 5 MB." }, 400);
  }
  let receiptBytes: Uint8Array;
  try {
    receiptBytes = Uint8Array.from(atob(receiptContent), (character) => character.charCodeAt(0));
  } catch {
    return jsonResponse({ error: "O arquivo do comprovante está inválido. Anexe-o novamente." }, 400);
  }
  const [, receiptFormat] = receiptMimeType;
  if (
    receiptBytes.length !== receiptByteLength ||
    !receiptFormat.signature.every((byte, index) => receiptBytes[index] === byte) ||
    (receiptType === "image/webp" &&
      String.fromCharCode(...receiptBytes.slice(8, 12)) !== "WEBP")
  ) {
    return jsonResponse({ error: "O formato do arquivo não corresponde ao comprovante anexado." }, 400);
  }
  const receiptExtension = receiptFormat.extension;

  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return jsonResponse({ error: "Escolha uma data válida." }, 400);
  }
  const { localToday, lastDay } = brazilDateRange();
  const utcDay = new Date(`${date}T12:00:00Z`);
  if (utcDay < localToday || utcDay > lastDay || utcDay.getUTCDay() === 0) {
    return jsonResponse({ error: "Escolha uma data disponível nos próximos 90 dias." }, 400);
  }
  if (date === brazilToday() && time <= brazilCurrentTime()) {
    return jsonResponse({ error: "Esse horário já passou. Escolha um horário futuro." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  const emailFromSetting = normalizeEmailFrom(Deno.env.get("EMAIL_FROM"));
  const emailFrom = emailFromSetting.value;
  if (!supabaseUrl || !serviceKey) {
    console.error("Booking submission is missing its server-side Supabase configuration.");
    return jsonResponse({
      error: `Configuração da função incompleta: ${[
        !supabaseUrl && "SUPABASE_URL",
        !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean).join(", ")} não definido.`,
    }, 503);
  }

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: serviceDuration, error: durationError } = await client.from("service_durations")
    .select("duration_minutes")
    .eq("service", catalogItem.durationService)
    .single();
  if (durationError || !serviceDuration) {
    console.error("Failed to retrieve service duration:", durationError?.message || "No duration was returned.");
    return jsonResponse({
      error: `Falha ao consultar a duração do serviço${durationError?.code ? ` (${durationError.code})` : ""}: ${durationError?.message || "nenhuma duração cadastrada foi retornada"}${durationError?.details ? ` — ${durationError.details}` : ""}`,
    }, 500);
  }
  const durationMinutes = serviceDuration.duration_minutes;
  const { data: blocks, error: blocksError } = await client.from("schedule_blocks")
    .select("start_time,end_time")
    .eq("blocked_date", date);
  if (blocksError) {
    console.error("Failed to check schedule blocks:", blocksError.message);
    return jsonResponse({
      error: `Falha ao consultar bloqueios da agenda${blocksError.code ? ` (${blocksError.code})` : ""}: ${blocksError.message}${blocksError.details ? ` — ${blocksError.details}` : ""}`,
    }, 500);
  }
  const requestedStart = timeToMinutes(time);
  const requestedEnd = requestedStart + durationMinutes;
  const isBlocked = blocks.some((block) =>
    block.start_time === null ||
    (requestedStart < timeToMinutes(String(block.end_time)) &&
      requestedEnd > timeToMinutes(String(block.start_time)))
  );
  if (isBlocked) {
    return jsonResponse({
      code: "slot_taken",
      error: unavailableBookingMessage,
    }, 409);
  }

  const { data: existingBookings, error: bookingsError } = await client.from("bookings")
    .select("booking_time,duration_minutes")
    .eq("booking_date", date)
    .in("status", ["pending", "confirmed"]);
  if (bookingsError) {
    console.error("Failed to check overlapping bookings:", bookingsError.message);
    return jsonResponse({
      error: `Falha ao consultar reservas existentes${bookingsError.code ? ` (${bookingsError.code})` : ""}: ${bookingsError.message}${bookingsError.details ? ` — ${bookingsError.details}` : ""}`,
    }, 500);
  }
  if (existingBookings.some((booking) => {
    const start = timeToMinutes(booking.booking_time);
    return requestedStart < start + booking.duration_minutes &&
      requestedEnd > start;
  })) {
    return jsonResponse({
      code: "slot_taken",
      error: unavailableBookingMessage,
    }, 409);
  }

  const bookingId = crypto.randomUUID();
  const depositCents = calculateDepositCents(catalogItem.priceCents);
  const { data: booking, error: insertError } = await client.from("bookings").insert({
    id: bookingId,
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    service,
    details,
    booking_date: date,
    booking_time: time,
    duration_minutes: durationMinutes,
    service_price_cents: catalogItem.priceCents,
    deposit_cents: depositCents,
    payment_method: paymentMethod,
  }).select("id").single();

  if (insertError?.code === "23505" || insertError?.code === "23P01") {
    return jsonResponse({
      code: "slot_taken",
      error: unavailableBookingMessage,
    }, 409);
  }
  if (insertError || !booking) {
    console.error("Failed to save the booking:", insertError?.message || "No booking was returned.");
    const databaseError = insertError
      ? [insertError.code, insertError.message, insertError.details, insertError.hint].filter(Boolean).join(" — ")
      : "o banco não retornou o registro criado";
    return jsonResponse({ error: `Falha ao salvar pedido no banco: ${databaseError}` }, 500);
  }

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeService = escapeHtml(service);
  const safeDetails = escapeHtml(details || "Nenhum detalhe informado");
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(utcDay);
  const whatsapp = phone.replace(/\D/g, "");
  const paymentMethodLabel = paymentMethod === "pix" ? "Pix" : "Cartão de crédito";
  const priceLabel = formatCurrency(catalogItem.priceCents);
  const depositLabel = formatCurrency(depositCents);
  const receiptAttachment = {
    filename: `comprovante-${bookingId}.${receiptExtension}`,
    content: receiptContent,
  };
  const adminMessage = {
    from: emailFrom || "",
    to: adminEmail ? [adminEmail] : [],
    subject: `Comprovante de reserva — ${name}`,
    html: `<h2>Novo pedido de reserva — Batista Beauty</h2><p><strong>Cliente:</strong> ${safeName}</p><p><strong>Telefone:</strong> ${safePhone} (<a href="https://wa.me/${whatsapp}">conversar no WhatsApp</a>)</p><p><strong>E-mail:</strong> ${escapeHtml(email)}</p><p><strong>Serviço:</strong> ${safeService} (${formatDuration(durationMinutes)})</p><p><strong>Data:</strong> ${dateLabel} às ${time}</p><p><strong>Valor total:</strong> ${priceLabel}</p><p><strong>Sinal para reserva (50% arredondado para baixo, sem centavos):</strong> ${depositLabel}</p><p><strong>Pagamento informado:</strong> ${paymentMethodLabel}</p><p><strong>Comprovante:</strong> anexado a este e-mail.</p><p><strong>Detalhes:</strong> ${safeDetails}</p><p>Confira o pagamento e o comprovante antes de confirmar o horário no painel da Batista Beauty.</p>`,
    attachments: [receiptAttachment],
  };
  const customerMessage = {
    from: emailFrom || "",
    to: [email],
    subject: "Recebemos seu comprovante — Batista Beauty",
    html: `<p>Olá, ${safeName}!</p><p>Recebemos seu pedido para <strong>${safeService}</strong> em <strong>${dateLabel} às ${time}</strong>.</p><p><strong>Valor do serviço:</strong> ${priceLabel}<br><strong>Sinal para reserva (50% arredondado para baixo, sem centavos):</strong> ${depositLabel}<br><strong>Pagamento informado:</strong> ${paymentMethodLabel}</p><p>O comprovante foi anexado. A reserva ainda não está confirmada: a Batista Beauty vai conferir o pagamento e confirmar o horário.</p><p>Seus detalhes: ${safeDetails}</p><p>A Batista Beauty poderá entrar em contato pelo WhatsApp ${safePhone}.</p><p>Com carinho,<br>Batista Beauty</p>`,
    attachments: [receiptAttachment],
  };

  const [adminDelivery, customerDelivery] = await Promise.all([
    { recipient: "admin", message: adminMessage },
    { recipient: "customer", message: customerMessage },
  ].map(async ({ recipient, message }) => {
    if (!resendKey || !emailFrom || (recipient === "admin" && !adminEmail)) {
      const missing = [
        !resendKey && "RESEND_API_KEY",
        !emailFrom && !emailFromSetting.error && "EMAIL_FROM",
        recipient === "admin" && !adminEmail && "ADMIN_EMAIL",
      ].filter(Boolean);
      const error = emailFromSetting.error ||
        `Segredo ausente no Supabase: ${missing.join(", ")}.`;
      console.error(`Could not send the ${recipient} booking email. ${error}`);
      return { sent: false, error };
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
      if (!response.ok) {
        let providerMessage = "";
        try {
          const responseBody = await response.json();
          if (typeof responseBody?.message === "string") providerMessage = responseBody.message;
        } catch {
          providerMessage = "";
        }
        const error = `Resend retornou HTTP ${response.status}${providerMessage ? `: ${providerMessage}` : "."}`;
        console.error(`Resend could not send the ${recipient} booking email: ${error}`);
        return { sent: false, error };
      }
      return { sent: true, error: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Falha de conexão com o Resend.";
      console.error(`Resend request for the ${recipient} booking email failed:`, reason);
      return { sent: false, error: `Falha de conexão com o Resend: ${reason}` };
    }
  }));
  const notificationsSent = adminDelivery.sent && customerDelivery.sent;
  const { error: notificationUpdateError } = await client.from("bookings")
    .update({
      notifications_sent: notificationsSent,
      admin_email_sent: adminDelivery.sent,
    })
    .eq("id", booking.id);
  if (notificationUpdateError) {
    console.error("The booking was saved but its email delivery status could not be saved:", notificationUpdateError.message);
  }

  return jsonResponse({
    bookingId: booking.id,
    notificationsSent,
    emailDelivery: {
      admin: adminDelivery.sent,
      customer: customerDelivery.sent,
    },
    emailErrors: {
      admin: adminDelivery.error,
      customer: customerDelivery.error,
    },
  }, 201);
});

function normalizeEmailFrom(value?: string) {
  let sender = value?.trim() || "";
  while (
    sender.length >= 2 &&
    ((sender.startsWith('"') && sender.endsWith('"')) ||
      (sender.startsWith("'") && sender.endsWith("'")))
  ) {
    sender = sender.slice(1, -1).trim();
  }
  if (!sender) {
    return { value: null, error: "Segredo EMAIL_FROM ausente no Supabase." };
  }

  const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  const namedSender = /^([^<>]+?)\s*<([^<>]+)>$/.exec(sender);
  const senderAddress = emailPattern.test(sender) ? sender : namedSender?.[2];
  if (!senderAddress) {
    if (/@(?:gmail|googlemail|outlook|hotmail|yahoo)\./i.test(sender)) {
      return {
        value: null,
        error: "EMAIL_FROM está mal formatado e usa um e-mail pessoal. O Resend exige um remetente de domínio próprio verificado. Use Batista Beauty <agenda@seudominio.com>, sem aspas, depois de verificar seu domínio no Resend.",
      };
    }
    return {
      value: null,
      error: "EMAIL_FROM inválido. Use remetente@dominio.com ou Batista Beauty <remetente@dominio.com>, sem aspas no valor.",
    };
  }
  const senderDomain = senderAddress.split("@")[1].toLowerCase();
  if (
    ["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "yahoo.com"].includes(senderDomain)
  ) {
    return {
      value: null,
      error: "EMAIL_FROM usa um e-mail pessoal. O Resend exige um remetente de domínio próprio verificado; configure, por exemplo, Batista Beauty <agenda@seudominio.com> após verificar esse domínio no Resend.",
    };
  }
  if (emailPattern.test(sender) || namedSender) {
    return { value: sender, error: null };
  }
  return {
    value: null,
    error: "EMAIL_FROM inválido. Use remetente@dominio-verificado ou Batista Beauty <remetente@dominio-verificado>.",
  };
}

function brazilToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function isValidSlot(value: string) {
  if (!/^(0[8-9]|1[0-6]):(00|30)$/.test(value)) return false;
  const minutes = timeToMinutes(value);
  return minutes <= 16 * 60 + 30;
}

function brazilCurrentTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function brazilDateRange() {
  const today = brazilToday();
  const localToday = new Date(`${today}T00:00:00Z`);
  const lastDay = new Date(localToday);
  lastDay.setUTCDate(lastDay.getUTCDate() + 90);
  return { localToday, lastDay };
}
