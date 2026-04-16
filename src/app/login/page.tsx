import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function expectedAdminHash() {
  const configuredHash = process.env.ADMIN_SECRET_HASH?.trim();
  if (configuredHash) {
    return configuredHash;
  }
  return createHash("sha256")
    .update(process.env.ADMIN_SECRET ?? "")
    .digest("hex");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";

    const providedSecret = String(formData.get("password") ?? "");
    const nextPath = String(formData.get("next") ?? "/");
    const expectedSecret = process.env.ADMIN_SECRET ?? "";

    if (!providedSecret || providedSecret !== expectedSecret) {
      redirect("/login?error=1");
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_authenticated", expectedAdminHash(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    redirect(nextPath.startsWith("/") ? nextPath : "/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
          Operator Console
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Enter admin password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          This console is for internal operations only.
        </p>

        <form action={authenticate} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              placeholder="Enter admin password"
            />
          </div>

          {params.error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Incorrect password
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Unlock console
          </button>
        </form>
      </div>
    </div>
  );
}
