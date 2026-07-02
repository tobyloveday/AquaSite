"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";

type Project = {
  id: string;
  project_code: string;
  project_name: string;
  client: string;
  location: string;
};

type Visit = {
  id: string;
  project_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
};

type Photo = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  captured_at: string;
  sync_status: string;
};

function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = usePromise(params);

  const [project, setProject] = useState<Project | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setProject(data.project))
      .catch(() => setError("Could not load project."));
  }, [projectId]);

  async function startVisit() {
    setError(null);
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) {
      setError("Could not start site visit.");
      return;
    }
    const data = await res.json();
    setVisit(data.visit);
    setPhotos([]);
  }

  async function endVisit() {
    if (!visit) return;
    await fetch(`/api/visits/${visit.id}/end`, { method: "POST" });
    setVisit(null);
    setNotes("");
  }

  async function handleCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !visit) return;

    setUploading(true);
    setError(null);
    setStatusMessage("Getting location…");

    const position = await getPosition();
    setStatusMessage(position ? "Uploading…" : "No location available — uploading anyway…");

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("clientId", crypto.randomUUID());
    formData.append("notes", notes);
    formData.append("capturedAt", new Date().toISOString());
    if (position) {
      formData.append("latitude", String(position.coords.latitude));
      formData.append("longitude", String(position.coords.longitude));
    }

    const res = await fetch(`/api/visits/${visit.id}/photos`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      setError("Photo failed to upload. Please try again.");
      setStatusMessage(null);
      setUploading(false);
      return;
    }

    const data = await res.json();
    setPhotos((prev) => [
      ...prev,
      {
        id: data.photo.id,
        latitude: data.photo.latitude,
        longitude: data.photo.longitude,
        notes: data.photo.notes,
        captured_at: data.photo.capturedAt,
        sync_status: data.photo.syncStatus,
      },
    ]);
    setNotes("");
    setStatusMessage(null);
    setUploading(false);
  }

  if (error && !project) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-8">
        <p className="text-red-600">{error}</p>
        <Link href="/projects" className="text-aqua underline">
          Back to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <Link href="/projects" className="text-sm text-aqua underline">
        ← Back to projects
      </Link>

      {project ? (
        <div>
          <h1 className="text-2xl font-bold text-aqua">
            {project.project_code} — {project.project_name}
          </h1>
          <p className="text-slate-600">
            {project.client} · {project.location}
          </p>
        </div>
      ) : (
        <p className="text-slate-500">Loading…</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!visit ? (
        <button
          onClick={startVisit}
          className="w-fit rounded-md bg-aqua px-4 py-2 font-medium text-white"
        >
          Start Site Visit
        </button>
      ) : (
        <div className="flex flex-col gap-4 rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-900">Site visit in progress</p>
            <button
              onClick={endVisit}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              End Visit
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Notes for next photo
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="w-fit rounded-md bg-aqua px-4 py-2 font-medium text-white">
            {uploading ? "Uploading…" : "Take Photo"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {statusMessage && <p className="text-sm text-slate-500">{statusMessage}</p>}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">
              Photos this visit ({photos.length})
            </p>
            <ul className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <li key={photo.id} className="flex flex-col gap-1">
                  <img
                    src={`/api/photos/${photo.id}`}
                    alt={photo.notes ?? "Site photo"}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  {photo.notes && (
                    <p className="truncate text-xs text-slate-500">{photo.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
