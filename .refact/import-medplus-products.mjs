import fs from "node:fs";

const root = "https://medplusnig.com";

const decodeHtml = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&nbsp;/g, " ")
    .replace(/â‚¦/g, "₦")
    .replace(/\s+/g, " ")
    .trim();

const parsePrice = (value = "") => Number(String(value).replace(/[^0-9.]/g, ""));

const titleFromSlug = (url) => {
  const slug = (url.split("/product/")[1] || "").split(/[?#]/)[0] || "";
  const base = slug.replace(/-[A-Za-z0-9]{6}$/, "");
  const keepUpper = new Set([
    "mg",
    "ml",
    "g",
    "tabs",
    "tab",
    "caps",
    "caplets",
    "caplet",
    "strip",
    "strips",
    "syrup",
    "cream",
    "gel",
    "lotion",
    "spf",
    "hiv",
    "aids",
    "ds",
    "pet",
    "cl",
    "kg"
  ]);

  return base
    .split("-")
    .filter(Boolean)
    .map((word) =>
      /^\d/.test(word) || keepUpper.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
    .replace(/\bAnd\b/g, "and")
    .replace(/\bFor\b/g, "for");
};

const categorize = (name) => {
  const lower = name.toLowerCase();
  if (/vit|centrum|supplement|calcium|zinc|magnesium|omega|wellman|wellwoman|pregnacare|seven seas/.test(lower)) return "MULTIVITAMINS AND SUPPLEMENTS";
  if (/malaria|lonart|coartem|amatem|artemether|lumefantrine|fansidar|quinine/.test(lower)) return "ANTIMALARIA";
  if (/paracetamol|panadol|ibuprofen|diclofenac|pain|heat|analgesic|nurofen/.test(lower)) return "PAIN RELIEVERS";
  if (/cough|cold|flu|lozenge|sore|shaltoux|procold|strepsils/.test(lower)) return "COUGH, COLD AND FLU";
  if (/antacid|gaviscon|lactulose|digest|stomach|ulcer|gestid|constipation/.test(lower)) return "DIGESTIVE HEALTH";
  if (/eye|ear|cerumol|optrex|drop/.test(lower)) return "EYE AND EAR MEDS";
  if (/bp|amlodipine|losartan|lisinopril|hypertension|cardio/.test(lower)) return "ANTIHYPERTENSIVES";
  if (/skin|cream|gel|lotion|bioderma|cetaphil|eos|soap|oil|toner|spf|acne|aqua/.test(lower)) return "SKIN CARE";
  if (/postinor|postpill|condom|viagra|vigor|dkt|ellaone|pregnancy|fertile|klovinal/.test(lower)) return "SEXUAL HEALTH";
  if (/test|thermometer|plaster|bandage|device|glove|mask|diagnostic|meter/.test(lower)) return "MEDICAL DEVICES AND DIAGNOSTICS";
  if (/baby|mother|child|diaper|pampers|cerelac/.test(lower)) return "MOTHER AND CHILD CARE";
  if (/antibiotic|amox|ampiclox|zithromax|azithro|cipro|cef/.test(lower)) return "ANTIBIOTICS";
  if (/fanta|coca|water|juice|ceres|drink/.test(lower)) return "DRINKS";
  return "GENERAL HEALTH";
};

const brandFromName = (name) => {
  const [first = "Medplus"] = name.split(/\s+/);
  return first.replace(/[^A-Za-z0-9']/g, "") || "Medplus";
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 Catalog Importer"
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.text();
}

function parseProducts(html) {
  const forms = html.split(/<form class="product-single-hover style--card mb-3\.5"/).slice(1);

  return forms
    .map((block) => {
      const sourceId = Number((block.match(/<input type="hidden" name="id" value="([^"]+)/) || [])[1]);
      const maxStock = Number((block.match(/\smax="([^"]+)/) || [])[1] || 1);
      const sourceUrl = decodeHtml((block.match(/href="(https:\/\/medplusnig\.com\/product\/[^"]+)/) || [])[1] || "");
      const image = decodeHtml((block.match(/<img\s+src="([^"]*product\/thumbnail[^"]*)/) || [])[1] || "");
      const priceText = decodeHtml((block.match(/(?:₦|â‚¦)\s*[\d,.]+/) || [])[0] || "");
      const listedName = decodeHtml(
        (block.match(/<a href="https:\/\/medplusnig\.com\/product\/[^"]+">\s*([\s\S]*?)\s*<\/a>/) || [])[1] || ""
      ).replace(/\.\.\.$/, "");
      const name = titleFromSlug(sourceUrl) || listedName;
      const price = parsePrice(priceText);
      const inStock = !/Out of stock/i.test(block) && maxStock > 0;

      if (!sourceId || !sourceUrl || !name || !price) return null;

      return {
        sourceId,
        name,
        description: `${name} from the imported MedPlus Nigeria catalog. Confirm dosage, availability, and suitability with a pharmacist before purchase.`,
        price,
        category: categorize(name),
        brand: brandFromName(name),
        popularity: Math.max(30, 100 - (sourceId % 70)),
        createdAt: "2026-05-20",
        requiresPrescription: /(antibiotic|amox|ampiclox|zithromax|azithro|cipro|cef|viagra|postinor|postpill|ellaone|klovinal|coartem|lonart|amatem|artemether|lumefantrine)/i.test(name),
        dosage: "Use as directed on the pack or by a licensed pharmacist/doctor.",
        image,
        sourceUrl,
        inStock,
        reviews: [
          {
            name: "Verified buyer",
            rating: 5,
            comment: "Useful product information and clear pricing."
          }
        ]
      };
    })
    .filter(Boolean);
}

const firstPage = await fetchText(`${root}/products?data_from=latest&page=1`);
const maxPage = Math.max(1, ...[...firstPage.matchAll(/page=(\d+)/g)].map((match) => Number(match[1])));
const productsBySourceId = new Map();

for (const product of parseProducts(firstPage)) {
  productsBySourceId.set(product.sourceId, product);
}

for (let page = 2; page <= maxPage; page += 1) {
  const html = await fetchText(`${root}/products?data_from=latest&page_no=1&page=${page}`);
  for (const product of parseProducts(html)) {
    productsBySourceId.set(product.sourceId, product);
  }
  if (page % 10 === 0) {
    console.log(`Scraped page ${page}/${maxPage}; ${productsBySourceId.size} products`);
  }
}

const products = [...productsBySourceId.values()]
  .sort((a, b) => a.sourceId - b.sourceId)
  .map((product, index) => ({ id: index + 1, ...product }));

fs.writeFileSync(".refact/medplus-products-raw.json", `${JSON.stringify(products, null, 2)}\n`);

const appProducts = products.map(({ sourceId, sourceUrl, inStock, ...product }) => product);
fs.writeFileSync("src/data/products.json", `${JSON.stringify(appProducts, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      maxPage,
      count: products.length,
      sample: products.slice(0, 3)
    },
    null,
    2
  )
);
