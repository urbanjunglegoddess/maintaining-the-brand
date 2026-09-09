// PHASE 1 — answers sync. GET returns the user's answers; PUT upserts one field.
// The client store (lib/store.ts) calls these instead of localStorage once auth is live.
import { NextResponse } from "next/server";

export async function GET() {
  // const sb = await supabaseServer();
  // const { data: { user } } = await sb.auth.getUser();
  // if (!user) return NextResponse.json({}, { status: 401 });
  // const { data } = await sb.from("answers").select("section,field_idx,value").eq("user_id", user.id);
  // return NextResponse.json(shape(data));
  return NextResponse.json({ todo: "phase 1: return user's answers keyed by section/field_idx" });
}

export async function PUT(_req: Request) {
  // const { section, field_idx, value } = await _req.json();
  // const sb = await supabaseServer();
  // const { data: { user } } = await sb.auth.getUser();
  // if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  // await sb.from("answers").upsert({ user_id: user.id, section, field_idx, value });
  // return NextResponse.json({ ok: true });
  return NextResponse.json({ todo: "phase 1: upsert one field for the signed-in user" });
}
