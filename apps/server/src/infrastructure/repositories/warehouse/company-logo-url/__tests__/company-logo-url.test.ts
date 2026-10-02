import { companyLogoUrl } from "@server/infrastructure/repositories/warehouse/company-logo-url/company-logo-url";

describe("companyLogoUrl", () => {
	it("builds the S3 upload URL from the company id and logo file name", () => {
		expect(companyLogoUrl(34, "Stadio.png")).toBe(
			"https://pleiapp.s3.amazonaws.com/uploads/company/logo/34/Stadio.png",
		);
		expect(companyLogoUrl("39", " Soccer_5_Logo_Plei_App.png ")).toBe(
			"https://pleiapp.s3.amazonaws.com/uploads/company/logo/39/Soccer_5_Logo_Plei_App.png",
		);
	});

	it("encodes characters S3 would misread, such as plus signs and spaces", () => {
		expect(companyLogoUrl(123, "Crossbar_Soccer_+_Beer.png")).toBe(
			"https://pleiapp.s3.amazonaws.com/uploads/company/logo/123/Crossbar_Soccer_%2B_Beer.png",
		);
		expect(companyLogoUrl(7, "My Logo.png")).toBe(
			"https://pleiapp.s3.amazonaws.com/uploads/company/logo/7/My%20Logo.png",
		);
	});

	it.each([
		[null, "Stadio.png"],
		[34, null],
		[34, ""],
		[34, "  "],
	])("has no logo for company %s and file %s", (companyId, logo) => {
		expect(companyLogoUrl(companyId, logo)).toBeNull();
	});
});
