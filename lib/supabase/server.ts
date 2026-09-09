// PHASE 1 STUB — server-side Supabase client (reads the session from cookies).
// Uncomment once @supabase/ssr is installed and env vars are set.
//
// import { createServerClient } from "@supabase/ssr";
// import { cookies } from "next/headers";
//
// export async function supabaseServer() {
//   const cookieStore = await cookies();
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: () => cookieStore.getAll(),
//         setAll: (all) => all.forEach(({ name, value, options }) =>
//           cookieStore.set(name, value, options)),
//       },
//     }
//   );
// }
//
// // Service-role client for the webhook only (server, never shipped to browser).
// import { createClient } from "@supabase/supabase-js";
// export const supabaseAdmin = () =>
//   createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export {};
