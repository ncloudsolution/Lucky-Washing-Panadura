// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { auth } from "./auth";

// // This function can be marked `async` if using `await` inside
// export async function middleware(request: NextRequest) {
//   console.log("🔥 Middleware is running on", request.nextUrl.pathname);
//   const session = await auth();
//   console.log(session, "🔴 session in middleware");

//   const authenticated = !!session?.user;
//   if (!authenticated) return NextResponse.redirect(new URL("/", request.url));

//   //authorization (to be continued)

//   return NextResponse.next();
// }

// // // See "Matching Paths" below to learn more
// export const config = {
//   matcher: ["/core/:path+"],
//   unstable_allowDynamic: ["**/node_modules/google-libphonenumber/**"],
//   //   runtime: "nodejs",
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only import lightweight helper functions for auth
import { getToken } from "next-auth/jwt"; // lightweight JWT check
import { posFrontend } from "./data/frontendRoutes";

// Middleware function

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isLanding = pathname === posFrontend.landing; // "/"
  const isProtected = pathname.startsWith("/core"); // protect all /core pages

  // ✅ If user NOT logged in and trying to access protected page → send to landing
  if (!token && isProtected) {
    return NextResponse.redirect(new URL(posFrontend.landing, request.url));
  }

  // ✅ If user IS logged in and is on landing → send to POS
  if (token && isLanding) {
    return NextResponse.redirect(new URL(posFrontend.pos, request.url));
  }

  // ✅ Otherwise allow
  return NextResponse.next();
}
// Only run on /core/* routes
// export const config = {
//   matcher: ["/core/:path+"],
//   // runtime: "edge", // default, lightweight now
// };
