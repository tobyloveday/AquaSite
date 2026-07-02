import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold text-aqua">AquaSite</h1>
      <p className="max-w-md text-slate-600">
        Site progress photo capture for civil engineering, water, wastewater
        and infrastructure projects. Project selection, camera capture and
        the map view get built next.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-aqua px-4 py-2 font-medium text-white"
      >
        Log in
      </Link>
    </main>
  );
}
