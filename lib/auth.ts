import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { authEnabled } from "@/lib/config";

export type Viewer = { id: string; email: string | null };

/**
 * The signed-in user, or null.
 *
 * Null has two very different meanings, and callers must not conflate them:
 *   authEnabled === false → nobody can sign in; the app is in local mode.
 *   authEnabled === true  → a real anonymous visitor; send them to /login.
 */
export async function getViewer(): Promise<Viewer | null> {
  if (!authEnabled) return null;
  const sb = await supabaseServer();
  if (!sb) return null;
  // getUser() revalidates the JWT with Supabase — don't trust getSession() here.
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function getProfile(viewer: Viewer) {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb
    .from("profiles")
    .select("display_name, email, created_at")
    .eq("id", viewer.id)
    .maybeSingle();
  return data;
}
