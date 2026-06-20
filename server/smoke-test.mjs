import { handleApi } from "./api-handler.mjs";

const requests = [
  { httpMethod: "GET", rawUrl: "http://localhost/api/health" },
  { httpMethod: "GET", rawUrl: "http://localhost/api/products?limit=3&search=panadol" },
  {
    httpMethod: "POST",
    rawUrl: "http://localhost/api/orders",
    body: JSON.stringify({
      customer: { name: "Test Patient", phone: "+2348012345678" },
      delivery: { address: "Lagos, Nigeria" },
      items: [{ productId: 1, quantity: 1 }]
    })
  }
];

for (const request of requests) {
  const response = await handleApi(request);
  console.log(`${request.httpMethod} ${new URL(request.rawUrl).pathname} -> ${response.statusCode}`);
  console.log(response.body);
}
