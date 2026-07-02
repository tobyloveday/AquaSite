"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectCode, projectName, client, location }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-aqua">New Project</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Project code
          <input
            type="text"
            required
            value={projectCode}
            onChange={(event) => setProjectCode(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Project name
          <input
            type="text"
            required
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Client
          <input
            type="text"
            required
            value={client}
            onChange={(event) => setClient(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Location
          <input
            type="text"
            required
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-aqua px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Project"}
        </button>
      </form>
    </main>
  );
}
