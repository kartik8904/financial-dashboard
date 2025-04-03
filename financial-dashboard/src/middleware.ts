import { clerkMiddleware } from "@clerk/nextjs/server";

import { NextResponse } from "next/server";

export default clerkMiddleware((auth, req) => {
  console.log("✅ Clerk Middleware is running!"); // Debugging log
  return NextResponse.next();
});

export const config = {
  matcher: "/((?!_next|.*\\..*).*)",
};
