export const COMPANY_LOGO_BASE_URL = "https://pleiapp.s3.amazonaws.com/uploads/company/logo";

export function companyLogoUrl(
	companyId: number | string | null,
	logo: string | null,
): string | null {
	const fileName = logo?.trim();
	if (companyId === null || !fileName) return null;
	return `${COMPANY_LOGO_BASE_URL}/${encodeURIComponent(String(companyId))}/${encodeURIComponent(fileName)}`;
}
