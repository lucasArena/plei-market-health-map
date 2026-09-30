import { z } from "zod";

export const linearErrorsSchema = z.object({
	errors: z.array(z.object({ message: z.string() })).min(1),
});

export const fileUploadResponseSchema = z.object({
	data: z.object({
		fileUpload: z.object({
			success: z.boolean(),
			uploadFile: z
				.object({
					uploadUrl: z.url(),
					assetUrl: z.url(),
					headers: z.array(z.object({ key: z.string(), value: z.string() })),
				})
				.nullish(),
		}),
	}),
});

export const issueCreateResponseSchema = z.object({
	data: z.object({
		issueCreate: z.object({
			success: z.boolean(),
			issue: z.object({ identifier: z.string(), url: z.url() }).nullish(),
		}),
	}),
});
