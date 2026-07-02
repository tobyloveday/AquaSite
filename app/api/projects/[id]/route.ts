import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

type ProjectRow = {
  id: string;
  project_code: string;
  project_name: string;
  client: string;
  location: string;
  created_at: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();
  const project = await db
    .prepare(
      `SELECT id, project_code, project_name, client, location, created_at
       FROM projects WHERE id = ? AND org_id = ?`
    )
    .bind(id, session.orgId)
    .first<ProjectRow>();

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}
