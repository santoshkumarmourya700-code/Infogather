
process.env.WC_SERVER = "true";

import { Server } from "bun";
import path from "node:path";

// Helper to load handlers dynamically
async function loadHandler(name: string) {
  try {
    const module = await import(`./api/${name}.ts`);
    return module.default;
  } catch (e) {
    // console.error("Failed to load handler", name);
    return null;
  }
}

async function fetchRequestHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // API Routing
  if (url.pathname.startsWith("/api/")) {
    const endpoint = url.pathname.split("/api/")[1];

    // Safety check
    if (!endpoint || endpoint.includes("..") || endpoint.includes("/")) {
      return new Response("Invalid endpoint", { status: 400 });
    }

    const handler = await loadHandler(endpoint);
    if (!handler) {
      return new Response("Endpoint not found", { status: 404 });
    }

    // Adapt Request/Response for the Vercel-style middleware
    const query = Object.fromEntries(url.searchParams.entries());
    const mockReq = {
      query,
      url: url.toString(),
      // Add other properties if needed by middleware
    };

    let responseBody: any = null;
    let responseStatus = 200;
    const responseHeaders: Record<string, string> = {};

    const mockRes = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        responseStatus = code;
        return this;
      },
      json(body: any) {
        responseBody = body;
        return this;
      },
      setHeader(key: string, value: string) {
        responseHeaders[key] = value;
      }
    };

    try {
      await handler(mockReq, mockRes);
      return Response.json(responseBody, { status: responseStatus, headers: responseHeaders });
    } catch (err: any) {
      console.error(err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // Static File Serving
  let filePath = url.pathname;
  if (filePath === "/") filePath = "/index.html";

  // Remove leading slash for local file path resolution
  // Bun.file relative paths are relative to cwd
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const file = Bun.file(cleanPath);

  if (await file.exists()) {
    return new Response(file);
  }

  return new Response("Not Found", { status: 404 });
}

const server = Bun.serve({
  port: 3000,
  fetch: fetchRequestHandler,
});

console.log(`🦊 Web Check is running at http://${server.hostname}:${server.port}`);