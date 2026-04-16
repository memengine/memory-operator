import { NextRequest, NextResponse } from "next/server";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedAdminHash(): Promise<string> {
  const configuredHash = process.env.ADMIN_SECRET_HASH?.trim();
  if (configuredHash) {
    return configuredHash;
  }
  return sha256Hex(process.env.ADMIN_SECRET ?? "");
}

function applyRobotsHeader(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(?:css|js|map|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === "/login";
  const cookieValue = request.cookies.get("admin_authenticated")?.value ?? "";
  const authenticated = cookieValue.length > 0 && cookieValue === (await expectedAdminHash());

  if (!authenticated && !isLoginRoute) {
    if (pathname.startsWith("/api/")) {
      return applyRobotsHeader(
        NextResponse.json({ error: "unauthorized" }, { status: 401 }),
      );
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return applyRobotsHeader(NextResponse.redirect(loginUrl));
  }

  if (authenticated && isLoginRoute) {
    return applyRobotsHeader(
      NextResponse.redirect(new URL("/", request.url)),
    );
  }

  return applyRobotsHeader(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
