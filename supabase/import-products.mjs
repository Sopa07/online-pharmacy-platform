// One-off import of src/data/products.json into the Supabase `products` table.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/import-products.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(supabaseUrl)) {
  console.error(`SUPABASE_URL doesn't look right: "${supabaseUrl}"`);
  console.error("It must be exactly your project URL, e.g. https://abcdefghij.supabase.co");
  console.error("(Dashboard → Project Settings → Data API → Project URL — no /rest/v1, no trailing slash, not the supabase.com/dashboard link).");
  process.exit(1);
}
console.log(`Connecting to ${supabaseUrl} ...`);

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(
  await fs.readFile(path.join(rootDir, "src", "data", "products.json"), "utf8")
);

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

const rows = products.map((product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  brand: product.brand,
  popularity: product.popularity,
  createdAt: product.createdAt,
  requiresPrescription: product.requiresPrescription,
  dosage: product.dosage,
  image: product.image,
  reviews: product.reviews ?? []
}));

const BATCH = 200;
let imported = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
  if (error) {
    console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    if (/schema cache|could not find/i.test(error.message)) {
      console.error("\nYour `products` table doesn't match the expected columns.");
      console.error("Run supabase/reset-products.sql in the Supabase SQL Editor, then run this import again.");
    }
    process.exit(1);
  }
  imported += chunk.length;
  console.log(`Imported ${imported}/${rows.length}`);
}

console.log("Done.");
