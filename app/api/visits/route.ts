import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }

  const db = await getDb();

  const project = await db
    .prepare("SELECT id FROM projects WHERE id = ? AND org_id = ?")
    .bind(projectId, session.orgId)
    .first();
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO site_visits (id, project_id, user_id) VALUES (?, ?, ?)")
    .bind(id, projectId, session.id)
    .run();

  const visit = await db
    .prepare("SELECT id, project_id, user_id, started_at, ended_at FROM site_visits WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ visit }, { status: 201 });
}
