"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Project = {
  id: string;
  project_code: string;
  project_name: string;
  client: string;
  location: string;
  created_at: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadProjects(query: string) {
    const res = await fetch(`/api/projects?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      setError("Could not load projects.");
      return;
    }
    const data = await res.json();
    setProjects(data.projects);
    setError(null);
  }

  useEffect(() => {
    loadProjects("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    loadProjects(search);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-aqua">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-aqua px-4 py-2 font-medium text-white"
        >
          + New Project
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by project code or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {projects === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-slate-500">No projects yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-md border border-slate-200 p-4 hover:border-aqua"
              >
                <p className="font-medium text-slate-900">
                  {project.project_code} — {project.project_name}
                </p>
                <p className="text-sm text-slate-600">
                  {project.client} · {project.location}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
