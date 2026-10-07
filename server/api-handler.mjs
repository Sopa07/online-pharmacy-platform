import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const MAX_BODY_BYTES = 1_000_000;
const PRODUCTS_CACHE_TTL_MS = 60_000;
const DELIVERY_FEE_NAIRA = 2500;
const PAYSTACK_API = process.env.PAYSTACK_API_BASE || "https://api.paystack.co";
const COUPON_PRESETS = {
  SHAZZAR10: { type: "percent", value: 10 },
  HEALTH5: { type: "percent", value: 5 },
  FREEDEL: { type: "delivery", value: 100 }
};

// createClient throws on empty or malformed credentials, so only build the
// client when both env vars are present and the URL looks like a Supabase URL.
let supabaseClient = null;
let supabaseInitError = null;
let productsCache = null;

function getSupabase() {
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  // Strip stray wrapping quotes and whitespace users often paste in.
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!supabaseUrl || !supabaseServiceKey) return null;
  if (!supabaseClient && !supabaseInitError) {
    const cleaned = supabaseUrl.replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/^["']|["']$/g, "");
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(cleaned)) {
      supabaseInitError = `SUPABASE_URL looks wrong (got "${supabaseUrl}"). It must be exactly https://your-project-id.supabase.co (Supabase → Settings → Data API → Project URL)`;
      console.warn(supabaseInitError);
      return null;
    }
    try {
      supabaseClient = createClient(cleaned, supabaseServiceKey);
    } catch (error) {
      supabaseInitError = `SUPABASE_SERVICE_ROLE_KEY was rejected (got ${describeSecret(supabaseServiceKey)}): ${error.message}. It must be the full service_role key from Supabase → Settings → API Keys (starts with eyJ or sb_secret_)`;
      console.warn(supabaseInitError);
      return null;
    }
  }
  return supabaseClient;
}

// Safe, masked fingerprint of a secret for error messages: never the value,
// just enough to spot a truncated or wrong variable.
function describeSecret(value) {
  const prefix = value.slice(0, 4);
  return `a ${value.length}-char value starting "${prefix}..."`;
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

async function getProducts(db) {
  if (productsCache && Date.now() - productsCache.fetchedAt < PRODUCTS_CACHE_TTL_MS) {
    return productsCache.data;
  }
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("popularity", { ascending: false });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }
  productsCache = { data, fetchedAt: Date.now() };
  return data;
}

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": headers.origin || process.env.API_ALLOWED_ORIGIN || "null",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      ...headers
    },
    body: statusCode === 204 ? "" : JSON.stringify(body)
  };
}

function getResponseHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const allowedOrigins = String(process.env.API_ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!origin || allowedOrigins.length === 0) return {};
  if (allowedOrigins.includes(origin)) return { origin };
  return {};
}

function getRoute(event) {
  const rawPath = event.rawUrl ? new URL(event.rawUrl).pathname : event.path || "/";
  return rawPath
    .replace(/^\/\.netlify\/functions\/api\/?/, "/")
    .replace(/^\/api\/?/, "/")
    .replace(/\/+$/, "") || "/";
}

function getQuery(event) {
  if (event.rawUrl) {
    return Object.fromEntries(new URL(event.rawUrl).searchParams.entries());
  }
  return event.queryStringParameters || {};
}

function parseBody(event) {
  if (!event.body) return {};
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return { __bodyTooLarge: true };
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function isAuthConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isPaymentConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

async function paystackRequest(path, options = {}) {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  return response.json();
}

// Initializes a Paystack transaction for an order. Returns the hosted-checkout
// URL to send the customer to, or null when payment is not configured/failed.
async function initializePayment(order, customerEmail, callbackUrl) {
  if (!isPaymentConfigured()) return null;
  const result = await paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: customerEmail || "customer@shazzarcarepharmacy.com",
      amount: Math.round(Number(order.total) * 100), // kobo
      currency: "NGN",
      reference: order.reference,
      callback_url: callbackUrl,
      metadata: {
        order_reference: order.reference,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone
      }
    })
  });
  return result?.status && result.data?.authorization_url ? result.data.authorization_url : null;
}

function verifyPaystackSignature(event) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";
  const signature = event.headers?.["x-paystack-signature"] || event.headers?.["X-Paystack-Signature"] || "";
  if (!secret || !signature || !rawBody) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
}

async function markOrderPaid(db, reference, paymentReference) {
  const { data: order } = await db
    .from("orders")
    .select("id,payment_status")
    .eq("reference", reference)
    .maybeSingle();
  if (!order) return null;
  if (order.payment_status !== "paid") {
    await db
      .from("orders")
      .update({
        payment_status: "paid",
        payment_reference: paymentReference || reference,
        paid_at: new Date().toISOString()
      })
      .eq("id", order.id);
  }
  return order;
}

// user_metadata is writable by the signed-in user, so roles come only from
// app_metadata (service-role writable) or the ADMIN_EMAILS allowlist.
function resolveRole(user) {
  return (
    user.app_metadata?.role ||
    (getAdminEmails().includes(normalizeEmail(user.email)) ? "admin" : "customer")
  );
}

function getBearerToken(event) {
  const authorization = event.headers?.authorization || event.headers?.Authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function verifySessionToken(token) {
  const db = getSupabase();
  if (!token || !db) return null;
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;

  return {
    sub: user.id,
    email: normalizeEmail(user.email),
    name: user.user_metadata?.name || "Patient",
    phone: user.user_metadata?.phone || "",
    role: resolveRole(user)
  };
}

async function requireAuth(event) {
  const session = await verifySessionToken(getBearerToken(event));
  return session ? { session } : { error: "Authentication required." };
}

async function requireAdmin(event) {
  const auth = await requireAuth(event);
  if (auth.error) return auth;
  if (auth.session.role !== "admin") return { error: "Admin access required.", status: 403 };
  return auth;
}

function publicProduct(product) {
  const { sourceImageUrl, ...safeProduct } = product;
  return safeProduct;
}

function publicUser(user) {
  return {
    id: user.id || user.sub,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role || "customer"
  };
}

function paginate(items, query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 24)));
  const start = (page - 1) * limit;
  return {
    page,
    limit,
    total: items.length,
    pageCount: Math.max(1, Math.ceil(items.length / limit)),
    data: items.slice(start, start + limit)
  };
}

function filterProducts(products, query) {
  let result = [...products];

  if (query.search) {
    const search = query.search.toLowerCase();
    result = result.filter((product) =>
      [product.name, product.brand, product.category].some((value) =>
        String(value || "").toLowerCase().includes(search)
      )
    );
  }

  if (query.category && query.category !== "All") {
    result = result.filter((product) => product.category === query.category);
  }

  if (query.maxPrice) {
    result = result.filter((product) => product.price <= Number(query.maxPrice));
  }

  if (query.sort === "price") {
    result.sort((a, b) => a.price - b.price);
  } else if (query.sort === "newest") {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    result.sort((a, b) => b.popularity - a.popularity);
  }

  return result;
}

function createReference(prefix) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const entropy = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${date}-${entropy}`;
}

function validateOrder(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (!Array.isArray(body.items) || body.items.length === 0) return "Order must include at least one item.";
  if (typeof body.customer?.name !== "string" || !body.customer.name.trim()) return "Customer name is required.";
  if (typeof body.customer?.phone !== "string" || !body.customer.phone.trim()) return "Customer phone is required.";
  if (typeof body.delivery?.address !== "string" || !body.delivery.address.trim()) return "Delivery address is required.";
  if (
    body.items.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        !Number.isFinite(Number(item.productId)) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
    )
  ) {
    return "Every order item must include a valid productId and quantity.";
  }
  return null;
}

function validatePrescription(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (typeof body.patient?.name !== "string" || !body.patient.name.trim()) return "Patient name is required.";
  if (typeof body.patient?.phone !== "string" || !body.patient.phone.trim()) return "Patient phone is required.";
  if (typeof body.prescription?.fileName !== "string" || !body.prescription.fileName.trim()) {
    return "Prescription file name is required.";
  }
  if (body.prescription?.fileType && !["application/pdf", "image/jpeg", "image/png"].includes(body.prescription.fileType)) {
    return "Prescription file type must be PDF, JPG, or PNG.";
  }
  return null;
}

function validateConsultation(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (body.specialistId == null || body.specialistId === "" || !Number.isFinite(Number(body.specialistId))) {
    return "Specialist is required.";
  }
  if (typeof body.specialistName !== "string" || !body.specialistName.trim()) return "Specialist name is required.";
  if (typeof body.date !== "string" || !body.date.trim()) return "Consultation date is required.";
  if (typeof body.timeSlot !== "string" || !body.timeSlot.trim()) return "Time slot is required.";
  if (typeof body.reason !== "string" || !body.reason.trim()) return "Reason for consultation is required.";
  if (!["video", "chat"].includes(body.method)) return "Consultation method must be video or chat.";
  return null;
}

function validateHealthProfile(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (body.age != null && body.age !== "" && (!Number.isFinite(Number(body.age)) || Number(body.age) < 1)) {
    return "Age must be valid.";
  }
  if (body.weight != null && body.weight !== "" && (!Number.isFinite(Number(body.weight)) || Number(body.weight) < 1)) {
    return "Weight must be valid.";
  }
  return null;
}

function validateRegister(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (typeof body.name !== "string" || !body.name.trim()) return "Full name is required.";
  if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(body.email))) {
    return "A valid email is required.";
  }
  if (typeof body.phone !== "string" || !body.phone.trim()) return "Phone number is required.";
  if (typeof body.password !== "string" || body.password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

function validateLogin(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(body.email))) {
    return "A valid email is required.";
  }
  if (typeof body.password !== "string" || !body.password) return "Password is required.";
  return null;
}

export async function handleApi(event) {
  try {
    return await handleApiInner(event);
  } catch (error) {
    // Never let an unexpected error surface as Netlify's HTML error page —
    // the client expects JSON so it can show a meaningful message.
    console.error("Unhandled API error:", error);
    return json(500, {
      error: `Server error: ${error.message}. Please try again or contact support.`
    }, getResponseHeaders(event));
  }
}

async function handleApiInner(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  const route = getRoute(event);
  const query = getQuery(event);
  const headers = getResponseHeaders(event);

  if (method === "OPTIONS") {
    return json(204, {}, headers);
  }

  if (method === "GET" && (route === "/" || route === "/health")) {
    const rawUrl = (process.env.SUPABASE_URL || "").trim();
    const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    return json(200, {
      ok: true,
      service: "shazzar-pharmacy-api",
      authConfigured: isAuthConfigured(),
      // Masked env fingerprints (values never exposed) to debug config remotely.
      env: {
        supabaseUrlSeen: rawUrl ? `"${rawUrl.slice(0, 40)}${rawUrl.length > 40 ? "..." : ""}" (${rawUrl.length} chars)` : "(empty)",
        serviceKeySeen: rawKey ? `a ${rawKey.length}-char value starting "${rawKey.slice(0, 4)}..."` : "(empty)",
        paystackSeen: process.env.PAYSTACK_SECRET_KEY ? "set" : "(empty)"
      },
      timestamp: new Date().toISOString()
    }, headers);
  }

  const db = getSupabase();
  if (!db) {
    return json(503, {
      error: supabaseInitError
        ? `${supabaseInitError} Fix the SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables and redeploy.`
        : "Backend services are not configured for this deployment. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify, then redeploy."
    }, headers);
  }

  if (method === "GET" && route === "/auth/me") {
    const auth = await requireAuth(event);
    if (auth.error) return json(401, { error: auth.error }, headers);
    return json(200, { data: { user: publicUser(auth.session) } }, headers);
  }

  if (method === "POST" && route === "/auth/register") {
    const body = parseBody(event);
    if (body?.__bodyTooLarge) return json(413, { error: "Request body is too large." }, headers);
    const error = validateRegister(body);
    if (error) return json(400, { error }, headers);

    const email = normalizeEmail(body.email);
    const { data, error: signUpError } = await db.auth.signUp({
      email,
      password: body.password,
      options: {
        data: {
          name: body.name.trim(),
          phone: body.phone.trim()
        }
      }
    });

    if (signUpError) {
      if (signUpError.status === 409 || /already (exists|registered)/i.test(signUpError.message)) {
        return json(409, { error: "An account already exists for this email. Please log in." }, headers);
      }
      return json(400, { error: signUpError.message }, headers);
    }

    const token = data.session?.access_token || "";
    return json(201, {
      data: {
        user: {
          id: data.user.id,
          name: data.user.user_metadata.name,
          email: data.user.email,
          phone: data.user.user_metadata.phone,
          role: resolveRole(data.user)
        },
        token,
        // With email confirmation enabled, Supabase returns no session until the
        // user clicks the emailed link — the client must not treat this as a login.
        needsConfirmation: !token
      }
    }, headers);
  }

  if (method === "POST" && route === "/auth/login") {
    const body = parseBody(event);
    if (body?.__bodyTooLarge) return json(413, { error: "Request body is too large." }, headers);
    const error = validateLogin(body);
    if (error) return json(400, { error }, headers);

    const email = normalizeEmail(body.email);
    const { data, error: signInError } = await db.auth.signInWithPassword({
      email,
      password: body.password
    });

    if (signInError) {
      return json(401, { error: "Invalid email or password. Create an account first if you have not registered." }, headers);
    }

    return json(200, {
      data: {
        user: {
          id: data.user.id,
          name: data.user.user_metadata.name,
          email: data.user.email,
          phone: data.user.user_metadata.phone,
          role: resolveRole(data.user)
        },
        token: data.session.access_token
      }
    }, headers);
  }

  if (method === "GET" && route === "/products") {
    const products = await getProducts(db);
    const result = paginate(filterProducts(products, query).map(publicProduct), query);
    return json(200, result, headers);
  }

  const productMatch = route.match(/^\/products\/(\d+)$/);
  if (method === "GET" && productMatch) {
    const products = await getProducts(db);
    const product = products.find((item) => item.id === Number(productMatch[1]));
    return product ? json(200, { data: publicProduct(product) }, headers) : json(404, { error: "Product not found." }, headers);
  }

  if (method === "POST" && route === "/orders") {
    const auth = await requireAuth(event);
    if (auth.error) return json(401, { error: auth.error }, headers);

    const body = parseBody(event);
    if (body?.__bodyTooLarge) return json(413, { error: "Request body is too large." }, headers);
    const error = validateOrder(body);
    if (error) return json(400, { error }, headers);
    const productIds = [...new Set(body.items.map((item) => Number(item.productId)))];
    const { data: products, error: productsError } = await db
      .from("products")
      .select("id,price")
      .in("id", productIds);
    if (productsError) {
      return json(400, { error: productsError.message }, headers);
    }
    const priceByProductId = new Map(products.map((product) => [Number(product.id), Number(product.price)]));
    if (productIds.some((id) => !priceByProductId.has(id))) {
      return json(400, { error: "One or more products in this order are no longer available." }, headers);
    }

    // Price the order from the catalog and coupon presets; client-supplied amounts are ignored.
    const pricedItems = body.items.map((item) => ({
      product_id: Number(item.productId),
      quantity: Number(item.quantity),
      unit_price: priceByProductId.get(Number(item.productId))
    }));
    const subtotal = pricedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const couponCode = typeof body.coupon === "string" ? body.coupon.trim().toUpperCase() : "";
    const coupon = COUPON_PRESETS[couponCode] || null;
    const deliveryFee = coupon?.type === "delivery" ? 0 : DELIVERY_FEE_NAIRA;
    const discountAmount = coupon?.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : 0;
    const total = subtotal + deliveryFee - discountAmount;

    const reference = createReference("ORD");
    const { data: order, error: orderError } = await db
      .from("orders")
      .insert([{
        reference,
        user_id: auth.session.sub,
        customer_name: body.customer.name.trim(),
        customer_phone: body.customer.phone.trim(),
        delivery_address: body.delivery.address.trim(),
        delivery_instructions: typeof body.delivery.instructions === "string" && body.delivery.instructions.trim()
          ? body.delivery.instructions.trim()
          : null,
        payment_method: typeof body.paymentMethod === "string" ? body.paymentMethod : null,
        coupon_code: coupon ? couponCode : null,
        subtotal,
        delivery_fee: deliveryFee,
        discount: discountAmount,
        total
      }])
      .select()
      .single();

    if (orderError) {
      return json(400, { error: orderError.message }, headers);
    }

    const itemsToInsert = pricedItems.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await db
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Don't leave an order row behind if its items could not be stored.
      await db.from("orders").delete().eq("id", order.id);
      return json(400, { error: itemsError.message }, headers);
    }

    // For prepaid methods, initialize a Paystack hosted checkout. Cash on
    // delivery keeps payment_status "pending" until the rider collects payment.
    const siteUrl = event.rawUrl ? new URL(event.rawUrl).origin : "";
    let authorizationUrl = null;
    if (body.paymentMethod !== "Cash on Delivery") {
      authorizationUrl = await initializePayment(
        order,
        auth.session.email,
        siteUrl ? `${siteUrl}/checkout` : undefined
      );
    }

    return json(201, {
      data: {
        reference: order.reference,
        status: order.status,
        paymentStatus: order.payment_status,
        receivedAt: order.created_at,
        authorizationUrl,
        requiresPayment: body.paymentMethod !== "Cash on Delivery"
      }
    }, headers);
  }

  if (method === "POST" && route === "/payments/webhook") {
    // Paystack sends the raw event body with an HMAC signature. Only mark an
    // order paid on a verified "charge.success" event; the customer is sent
    // back to /checkout, which verifies via /payments/verify on load.
    if (!verifyPaystackSignature(event)) {
      return json(401, { error: "Invalid webhook signature." }, headers);
    }
    const webhookBody = parseBody(event);
    if (webhookBody?.event === "charge.success" && webhookBody.data?.reference) {
      await markOrderPaid(db, webhookBody.data.reference, webhookBody.data.reference);
    }
    return json(200, { received: true }, headers);
  }

  if (method === "GET" && route === "/payments/verify") {
    const auth = await requireAuth(event);
    if (auth.error) return json(401, { error: auth.error }, headers);
    const reference = String(query.reference || "").trim();
    if (!reference) return json(400, { error: "Payment reference is required." }, headers);

    const { data: order } = await db
      .from("orders")
      .select("id,reference,total,payment_status,user_id")
      .eq("reference", reference)
      .maybeSingle();
    if (!order || order.user_id !== auth.session.sub) {
      return json(404, { error: "Order not found for this reference." }, headers);
    }

    let paymentStatus = order.payment_status;
    if (paymentStatus !== "paid" && isPaymentConfigured()) {
      // Confirm with Paystack directly before trusting the callback URL.
      const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
      const verified =
        result?.status &&
        result.data?.status === "success" &&
        Number(result.data.amount) === Math.round(Number(order.total) * 100);
      if (verified) {
        await markOrderPaid(db, reference, result.data.reference);
        paymentStatus = "paid";
      }
    }

    return json(200, {
      data: {
        reference: order.reference,
        paymentStatus,
        total: order.total
      }
    }, headers);
  }

  if (method === "POST" && route === "/consultations") {
    const auth = await requireAuth(event);
    if (auth.error) return json(401, { error: auth.error }, headers);

    const body = parseBody(event);
    if (body?.__bodyTooLarge) return json(413, { error: "Request body is too large." }, headers);
    const error = validateConsultation(body);
    if (error) return json(400, { error }, headers);

    const reference = createReference("CON");
    const { data: consultation, error: consultationError } = await db
      .from("consultations")
      .insert([{
        reference,
        user_id: auth.session.sub,
        patient_name: typeof body.patientName === "string" && body.patientName.trim() ? body.patientName.trim() : auth.session.name,
        patient_email: auth.session.email,
        patient_phone: typeof body.patientPhone === "string" && body.patientPhone.trim() ? body.patientPhone.trim() : auth.session.phone,
        specialist_id: Number(body.specialistId),
        specialist_name: body.specialistName.trim(),
        specialization: typeof body.specialization === "string" ? body.specialization : null,
        consultation_date: body.date.trim(),
        time_slot: body.timeSlot.trim(),
        method: body.method,
        reason: body.reason.trim()
      }])
      .select()
      .single();

    if (consultationError) {
      return json(400, { error: consultationError.message }, headers);
    }

    return json(201, {
      data: {
        reference: consultation.reference,
        status: consultation.status,
        receivedAt: consultation.created_at
      }
    }, headers);
  }

  if (method === "POST" && route === "/health-profile") {
    const auth = await requireAuth(event);
    if (auth.error) return json(401, { error: auth.error }, headers);

    const body = parseBody(event);
    if (body?.__bodyTooLarge) return json(413, { error: "Request body is too large." }, headers);
    const error = validateHealthProfile(body);
    if (error) return json(400, { error }, headers);

    const { error: profileError } = await db
      .from("health_profiles")
      .upsert({
        user_id: auth.session.sub,
        age: body.age ? Number(body.age) : null,
        gender: body.gender || null,
        weight: body.weight ? Number(body.weight) : null,
        allergies: body.allergies || null,
        chronic_conditions: body.chronicConditions || null,
        medications: body.medications || null,
        emergency_contact: body.emergencyContact || null,
        preferred_checkin: body.preferredCheckin || null,
        note: body.note || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (profileError) return json(400, { error: profileError.message }, headers);
    return json(200, { data: { saved: true } }, headers);
  }

  if (method === "GET" && route === "/admin/summary") {
    const auth = await requireAdmin(event);
    if (auth.error) return json(auth.status || 401, { error: auth.error }, headers);

    const [orders, prescriptions, consultations] = await Promise.all([
      db.from("orders").select("id", { count: "exact", head: true }),
      db.from("prescriptions").select("id", { count: "exact", head: true }),
      db.from("consultations").select("id", { count: "exact", head: true })
    ]);

    return json(200, {
      data: {
        orders: orders.count || 0,
        prescriptions: prescriptions.count || 0,
        consultations: consultations.count || 0
      }
    }, headers);
  }

  if (method === "GET" && route === "/admin/orders") {
    const auth = await requireAdmin(event);
    if (auth.error) return json(auth.status || 401, { error: auth.error }, headers);
    const { data, error } = await db
      .from("orders")
      .select("id,reference,customer_name,customer_phone,total,status,payment_status,payment_method,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return json(400, { error: error.message }, headers);
    return json(200, { data }, headers);
  }

  if (method === "GET" && route === "/admin/prescriptions") {
    const auth = await requireAdmin(event);
    if (auth.error) return json(auth.status || 401, { error: auth.error }, headers);
    const { data, error } = await db
      .from("prescriptions")
      .select("id,reference,patient_name,patient_phone,patient_email,status,file_path,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return json(400, { error: error.message }, headers);
    return json(200, { data }, headers);
  }

  if (method === "GET" && route === "/admin/consultations") {
    const auth = await requireAdmin(event);
    if (auth.error) return json(auth.status || 401, { error: auth.error }, headers);
    const { data, error } = await db
      .from("consultations")
      .select("id,reference,patient_name,patient_email,specialist_name,specialization,consultation_date,time_slot,method,status,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return json(400, { error: error.message }, headers);
    return json(200, { data }, headers);
  }

  if (method === "POST" && route === "/prescriptions") {
    const auth = await requireAuth(event);
    if (auth.error) return json(401, { error: auth.error }, headers);

    const body = parseBody(event);
    if (body?.__bodyTooLarge) return json(413, { error: "Request body is too large." }, headers);
    const error = validatePrescription(body);
    if (error) return json(400, { error }, headers);

    const reference = createReference("RX");
    const { data: rx, error: rxError } = await db
      .from("prescriptions")
      .insert([{
        reference,
        user_id: auth.session.sub,
        patient_name: body.patient.name.trim(),
        patient_phone: body.patient.phone.trim(),
        patient_email: typeof body.patient.email === "string" ? body.patient.email : null,
        delivery_address: typeof body.patient.address === "string" ? body.patient.address : null,
        file_path: body.prescription.fileName.trim()
      }])
      .select()
      .single();

    if (rxError) {
      return json(400, { error: rxError.message }, headers);
    }

    return json(201, {
      data: {
        reference: rx.reference,
        status: rx.status,
        receivedAt: rx.created_at
      }
    }, headers);
  }

  return json(404, {
    error: "Endpoint not found.",
    route
  }, headers);
}
