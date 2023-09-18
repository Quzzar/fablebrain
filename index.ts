import { initSupabase } from "./src/services/supabase";
import input from "./src/endpoints/input";
import output from "./src/endpoints/output";
import user from "./src/endpoints/user";
import sleep from "./src/endpoints/sleep";
import update from "./src/endpoints/update";
import action from "./src/endpoints/action";
import { RateLimiter } from "limiter";
import { createResponse } from "./src/utils";
import { startRuntime } from "./src/services/runtime";

// Init Supabase
initSupabase();

// Setup rate limiter
const limiter = new RateLimiter({
  tokensPerInterval: 35,
  interval: "minute",
  fireImmediately: true
});

// Run the server
const server = Bun.serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);

    const remainingRequests = await limiter.removeTokens(1);
    if (remainingRequests < 0) {
      if (url.pathname === "/api/v1/input") {
        return createResponse('Too many requests! Please send occasional, detailed input every couple seconds instead.', 429);
      } else {
        return createResponse('Too many requests!', 429);
      }
    }

    if (url.pathname === "/api/v1/user" || url.pathname.startsWith("/api/v1/user/")) return await user(req);
    if (url.pathname === "/api/v1/input") return await input(req);
    if (url.pathname === "/api/v1/output") return await output(req);
    if (url.pathname === "/api/v1/sleep") return await sleep(req);
    if (url.pathname === "/api/v1/update") return await update(req);
    if (url.pathname === "/api/v1/action") return await action(req);
    return new Response(`404!`);
  },
});

// Start the internal clock
startRuntime();

