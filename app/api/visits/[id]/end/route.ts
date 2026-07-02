import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();

  const visit = await db
    .prepare(
      `SELECT site_visits.id FROM site_visits
       JOIN projects ON projects.id = site_visits.project_id
       WHERE site_visits.id = ? AND projects.org_id = ?`
    )
    .bind(id, session.orgId)
    .first();
  if (!visit) {
    return NextResponse.json({ error: "Visit not found." }, { status: 404 });
  }

  await db
    .prepare("UPDATE site_visits SET ended_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  return NextResponse.json({ ok: true });
}
