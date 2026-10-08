import { handleApi } from "./api-handler.mjs";

async function request(input) {
  const response = await handleApi(input);
  console.log(`${input.httpMethod} ${new URL(input.rawUrl).pathname} -> ${response.statusCode}`);
  console.log(response.body);

  const expected = input.expectedStatus ? [].concat(input.expectedStatus) : null;
  if (expected && !expected.includes(response.statusCode)) {
    throw new Error(`Expected ${expected.join(" or ")}, received ${response.statusCode}`);
  }

  return JSON.parse(response.body || "{}");
}

await request({
  httpMethod: "GET",
  rawUrl: "http://localhost/api/health",
  expectedStatus: 200
});

await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/auth/login",
  expectedStatus: 401,
  body: JSON.stringify({
    email: "patient@example.com",
    password: "password123"
  })
});

await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/auth/register",
  expectedStatus: [201, 409],
  body: JSON.stringify({
    name: "Test Patient",
    email: "patient@example.com",
    phone: "+2348012345678",
    password: "password123"
  })
});

const login = await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/auth/login",
  expectedStatus: 200,
  body: JSON.stringify({
    email: "patient@example.com",
    password: "password123"
  })
});

await request({
  httpMethod: "GET",
  rawUrl: "http://localhost/api/products?limit=3&search=panadol",
  expectedStatus: 200
});

await request({
  httpMethod: "GET",
  rawUrl: "http://localhost/.netlify/functions/api/products/227",
  expectedStatus: 200
});

await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/orders",
  expectedStatus: 201, // guest checkout is allowed without login
  body: JSON.stringify({
    customer: { name: "Guest Patient", phone: "+2348012345678" },
    delivery: { address: "Lagos, Nigeria" },
    paymentMethod: "Cash on Delivery",
    items: [{ productId: 1, quantity: 1 }]
  })
});

await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/orders",
  expectedStatus: 400,
  headers: {
    authorization: `Bearer ${login.data.token}`
  },
  body: JSON.stringify({
    customer: { name: "Test Patient", phone: "+2348012345678" },
    delivery: { address: "Lagos, Nigeria" },
    items: [{ productId: 1, quantity: 0 }]
  })
});

await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/orders",
  expectedStatus: 201,
  headers: {
    authorization: `Bearer ${login.data.token}`
  },
  body: JSON.stringify({
    customer: { name: "Test Patient", phone: "+2348012345678" },
    delivery: { address: "Lagos, Nigeria" },
    paymentMethod: "Card (Naira)",
    items: [{ productId: 1, quantity: 1 }]
  })
});

await request({
  httpMethod: "POST",
  rawUrl: "http://localhost/api/prescriptions",
  expectedStatus: 201,
  headers: {
    authorization: `Bearer ${login.data.token}`
  },
  isBase64Encoded: true,
  body: Buffer.from(JSON.stringify({
    patient: { name: "Test Patient", phone: "+2348012345678" },
    prescription: {
      fileName: "prescription.pdf",
      fileType: "application/pdf",
      fileSize: 42_000
    }
  })).toString("base64")
});

console.log("Smoke tests passed.");
