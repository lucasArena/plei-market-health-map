import { createApiApp } from "@market-health-map/server";
import { getInternalAccess } from "@/infrastructure/auth/internal-access";

const api = createApiApp({ resolveAccess: () => getInternalAccess() });

export function GET(request: Request): Promise<Response> {
	return Promise.resolve(api.fetch(request));
}

export function POST(request: Request): Promise<Response> {
	return Promise.resolve(api.fetch(request));
}

export function PUT(request: Request): Promise<Response> {
	return Promise.resolve(api.fetch(request));
}
