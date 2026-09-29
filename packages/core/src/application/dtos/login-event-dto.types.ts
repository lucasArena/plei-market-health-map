import type {
	listRecentLoginsSchema,
	recordLoginSchema,
} from "@core/application/dtos/login-event-dto";
import type { z } from "zod";

export type RecordLoginInput = z.infer<typeof recordLoginSchema>;
export type ListRecentLoginsInput = z.input<typeof listRecentLoginsSchema>;

export interface LoginEventView {
	id: string;
	userId: string;
	email: string;
	signedInAt: string;
}
