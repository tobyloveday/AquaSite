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

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const db = await getDb();

  const statement = search
    ? db
        .prepare(
          `SELECT id, project_code, project_name, client, location, created_at
           FROM projects
           WHERE org_id = ? AND (project_code LIKE ? OR project_name LIKE ?)
           ORDER BY created_at DESC`
        )
        .bind(session.orgId, `%${search}%`, `%${search}%`)
    : db
        .prepare(
          `SELECT id, project_code, project_name, client, location, created_at
           FROM projects
           WHERE org_id = ?
           ORDER BY created_at DESC`
        )
        .bind(session.orgId);

  const { results } = await statement.all<ProjectRow>();
  return NextResponse.json({ projects: results });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectCode = typeof body?.projectCode === "string" ? body.projectCode.trim() : "";
  const projectName = typeof body?.projectName === "string" ? body.projectName.trim() : "";
  const client = typeof body?.client === "string" ? body.client.trim() : "";
  const location = typeof body?.location === "string" ? body.location.trim() : "";

  if (!projectCode || !projectName || !client || !location) {
    return NextResponse.json(
      { error: "Project code, name, client and location are all required." },
      { status: 400 }
    );
  }

  const db = await getDb();

  const existing = await db
    .prepare("SELECT id FROM projects WHERE org_id = ? AND project_code = ?")
    .bind(session.orgId, projectCode)
    .first();
  if (existing) {
    return NextResponse.json(
      { error: "A project with that code already exists." },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO projects (id, org_id, project_code, project_name, client, location)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, session.orgId, projectCode, projectName, client, location)
    .run();

  return NextResponse.json(
    { project: { id, projectCode, projectName, client, location } },
    { status: 201 }
  );
}
