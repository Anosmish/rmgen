export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/repos/:path*", "/generate/:path*", "/commit/:path*"],
};
