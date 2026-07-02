import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPhotosBucket } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/auth";

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

  const photo = await db
    .prepare(
      `SELECT photos.r2_object_key FROM photos
       JOIN projects ON projects.id = photos.project_id
       WHERE photos.id = ? AND projects.org_id = ?`
    )
    .bind(id, session.orgId)
    .first<{ r2_object_key: string }>();
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const bucket = await getPhotosBucket();
  const object = await bucket.get(photo.r2_object_key);
  if (!object) {
    return NextResponse.json({ error: "Photo file missing." }, { status: 404 });
  }

  return new NextResponse(object.body as unknown as BodyInit, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
