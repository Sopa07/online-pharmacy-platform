import http from "node:http";
import { handleApi } from "./api-handler.mjs";

const port = Number(process.env.PORT || 8888);

const server = http.createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const event = {
    httpMethod: request.method,
    rawUrl: `http://${request.headers.host}${request.url}`,
    headers: request.headers,
    body: Buffer.concat(chunks).toString("utf8")
  };

  try {
    const result = await handleApi(event);
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body || "");
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Internal server error.", detail: error.message }));
  }
});

server.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}/api/health`);
});
