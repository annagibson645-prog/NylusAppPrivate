import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

// PIN gate for the private /threads section. Auth state lives in a cookie
// whose value is a hash of the PIN — never the PIN itself — so the cookie
// can't be read back into the PIN even if someone inspects it.
const COOKIE_NAME = "nylus_threads_auth";

function expectedToken(): string | null {
  const pin = process.env.THREADS_PIN;
  if (!pin) return null;
  return createHash("sha256").update(pin).digest("hex");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/threads") && pathname !== "/threads/login") {
    // Fail CLOSED: if THREADS_PIN isn't configured in this environment,
    // token is null and cookie can never match it, so every request gets
    // sent to the login wall instead of silently passing through unlocked.
    const token = expectedToken();
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || cookie !== token) {
      const loginUrl = new URL("/threads/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/threads", "/threads/:path*"],
};
