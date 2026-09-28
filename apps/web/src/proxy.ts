import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PREFIXES = ["/sign-in", "/api/", "/~offline"];

export function isPublicPath(pathname: string): boolean {
	return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const proxy = auth((request) => {
	if (request.auth || isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
	return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
});

export const config = {
	matcher: [
		"/((?!_next|sw.js|swe-worker|maplibre|[^?]*\\.(?:html?|css|m?js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
	],
};
