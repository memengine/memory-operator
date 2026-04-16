import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiBase() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_API_BASE is required.");
  }
  return apiBase.replace(/\/$/, "");
}

function buildTargetUrl(request: NextRequest, pathSegments: string[]) {
  const target = new URL(`${getApiBase()}/v1/internal/${pathSegments.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target;
}

async function forward(request: NextRequest, pathSegments: string[]) {
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  if (!adminSecret) {
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500, headers: { "X-Robots-Tag": "noindex" } },
    );
  }

  const targetUrl = buildTargetUrl(request, pathSegments);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      "X-Admin-Secret": adminSecret,
    },
    body,
    cache: "no-store",
  });

  const payload = await response.text();
  const proxyResponse = new NextResponse(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
  return proxyResponse;
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}
