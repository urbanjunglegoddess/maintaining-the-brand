import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on navigation, so Server Components
 * always see a valid user. A no-op while Supabase is unconfigured.
 */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return NextResponse.next();

  const res = NextResponse.next({ request: req });

  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (all) =>
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  // Touching getUser() is what performs the refresh.
  await sb.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    // Everything except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
