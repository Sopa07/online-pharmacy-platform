import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const productsPath = path.join(rootDir, "src", "data", "products.json");

let productsCache;

async function getProducts() {
  if (!productsCache) {
    const productsJson = await fs.readFile(productsPath, "utf8");
    productsCache = JSON.parse(productsJson);
  }
  return productsCache;
}

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": process.env.API_ALLOWED_ORIGIN || "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      ...headers
    },
    body: JSON.stringify(body)
  };
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
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
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
  if (!body.customer?.name || !body.customer?.phone) return "Customer name and phone are required.";
  if (!body.delivery?.address) return "Delivery address is required.";
  return null;
}

function validatePrescription(body) {
  if (!body || typeof body !== "object") return "Request body must be valid JSON.";
  if (!body.patient?.name || !body.patient?.phone) return "Patient name and phone are required.";
  if (!body.prescription?.fileName) return "Prescription file name is required.";
  return null;
}

export async function handleApi(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  const route = getRoute(event);
  const query = getQuery(event);

  if (method === "OPTIONS") {
    return json(204, {});
  }

  if (method === "GET" && (route === "/" || route === "/health")) {
    return json(200, {
      ok: true,
      service: "shazzar-pharmacy-api",
      timestamp: new Date().toISOString()
    });
  }

  if (method === "GET" && route === "/products") {
    const products = await getProducts();
    return json(200, paginate(filterProducts(products, query), query));
  }

  const productMatch = route.match(/^\/products\/(\d+)$/);
  if (method === "GET" && productMatch) {
    const products = await getProducts();
    const product = products.find((item) => item.id === Number(productMatch[1]));
    return product ? json(200, { data: product }) : json(404, { error: "Product not found." });
  }

  if (method === "POST" && route === "/orders") {
    const body = parseBody(event);
    const error = validateOrder(body);
    if (error) return json(400, { error });

    return json(201, {
      data: {
        reference: createReference("ORD"),
        status: "received",
        paymentStatus: "pending",
        receivedAt: new Date().toISOString()
      }
    });
  }

  if (method === "POST" && route === "/prescriptions") {
    const body = parseBody(event);
    const error = validatePrescription(body);
    if (error) return json(400, { error });

    return json(201, {
      data: {
        reference: createReference("RX"),
        status: "queued_for_pharmacist_review",
        receivedAt: new Date().toISOString()
      }
    });
  }

  return json(404, {
    error: "Endpoint not found.",
    route
  });
}
