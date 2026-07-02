import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, SESSION_COOKIE } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(cookieStore.get(SESSION_COOKIE.name)?.value);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-aqua">Welcome, {session.name}</h1>
      <p className="text-slate-600">
        Logged in as {session.email} ({session.role})
      </p>
      <p className="max-w-md text-sm text-slate-500">
        This is a placeholder — project selection and the rest of the
        dashboard get built next.
      </p>
      <LogoutButton />
    </main>
  );
}
