import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPhotosBucket } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/auth";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

type PhotoRow = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  captured_at: string;
  sync_status: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: visitId } = await params;
  const db = await getDb();

  const visit = await db
    .prepare(
      `SELECT site_visits.id FROM site_visits
       JOIN projects ON projects.id = site_visits.project_id
       WHERE site_visits.id = ? AND projects.org_id = ?`
    )
    .bind(visitId, session.orgId)
    .first();
  if (!visit) {
    return NextResponse.json({ error: "Visit not found." }, { status: 404 });
  }

  const { results } = await db
    .prepare(
      `SELECT id, latitude, longitude, notes, captured_at, sync_status
       FROM photos WHERE visit_id = ? ORDER BY captured_at ASC`
    )
    .bind(visitId)
    .all<PhotoRow>();

  return NextResponse.json({ photos: results });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: visitId } = await params;
  const db = await getDb();

  const visit = await db
    .prepare(
      `SELECT site_visits.id, site_visits.project_id FROM site_visits
       JOIN projects ON projects.id = site_visits.project_id
       WHERE site_visits.id = ? AND projects.org_id = ?`
    )
    .bind(visitId, session.orgId)
    .first<{ id: string; project_id: string }>();
  if (!visit) {
    return NextResponse.json({ error: "Visit not found." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const photo = formData.get("photo");
  const clientId = formData.get("clientId");
  if (!(photo instanceof File) || typeof clientId !== "string" || !clientId) {
    return NextResponse.json({ error: "photo and clientId are required." }, { status: 400 });
  }

  const notesValue = formData.get("notes");
  const notes = typeof notesValue === "string" ? notesValue : "";

  const latitudeRaw = formData.get("latitude");
  const longitudeRaw = formData.get("longitude");
  const latitude = typeof latitudeRaw === "string" && latitudeRaw !== "" ? Number(latitudeRaw) : null;
  const longitude =
    typeof longitudeRaw === "string" && longitudeRaw !== "" ? Number(longitudeRaw) : null;

  const capturedAtRaw = formData.get("capturedAt");
  const capturedAt =
    typeof capturedAtRaw === "string" && capturedAtRaw ? capturedAtRaw : new Date().toISOString();

  const extension = EXTENSION_BY_MIME[photo.type] ?? "jpg";
  const objectKey = `photos/${visit.project_id}/${clientId}.${extension}`;

  const bucket = await getPhotosBucket();
  await bucket.put(objectKey, await photo.arrayBuffer(), {
    httpMetadata: { contentType: photo.type || "image/jpeg" },
  });

  await db
    .prepare(
      `INSERT INTO photos
         (id, visit_id, project_id, user_id, r2_object_key, latitude, longitude, notes, captured_at, synced_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'synced')
       ON CONFLICT(id) DO UPDATE SET
         r2_object_key = excluded.r2_object_key,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         notes = excluded.notes,
         captured_at = excluded.captured_at,
         synced_at = excluded.synced_at,
         sync_status = excluded.sync_status`
    )
    .bind(
      clientId,
      visitId,
      visit.project_id,
      session.id,
      objectKey,
      latitude,
      longitude,
      notes,
      capturedAt
    )
    .run();

  return NextResponse.json(
    {
      photo: {
        id: clientId,
        visitId,
        projectId: visit.project_id,
        latitude,
        longitude,
        notes,
        capturedAt,
        syncStatus: "synced",
      },
    },
    { status: 201 }
  );
}
