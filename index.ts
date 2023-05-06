import { initSupabase } from "./src/services/supabase";
import input from "./src/endpoints/input";
import output from "./src/endpoints/output";
import user from "./src/endpoints/user";
import sleep from "./src/endpoints/sleep";
import update from "./src/endpoints/update";

// Init Supabase
initSupabase();

// Run the server
const server = Bun.serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === "/user" || url.pathname.startsWith("/user/")) return await user(req);
    if (url.pathname === "/input") return await input(req);
    if (url.pathname === "/output") return await output(req);
    if (url.pathname === "/sleep") return await sleep(req);
    if (url.pathname === "/update") return await update(req);
    return new Response(`404!`);
  },
});

