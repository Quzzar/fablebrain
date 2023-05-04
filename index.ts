import { PrismaClient } from '@prisma/client/edge';
import feed from "./src/endpoints/feed";
import user from "./src/endpoints/user";
import { initSupabase } from "./src/supabase";
import sleep from "./src/endpoints/sleep";

// Init Supabase
initSupabase();

// Init Prisma
export const prisma = new PrismaClient();

// Run the server
const server = Bun.serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === "/user" || url.pathname.startsWith("/user/")) return await user(req);
    if (url.pathname === "/feed") return await feed(req);
    if (url.pathname === "/sleep") return await sleep(req);
    return new Response(`404!`);
  },
});

// Disconnect PrismaClient when the application exits
// TODO: await prisma.$disconnect();