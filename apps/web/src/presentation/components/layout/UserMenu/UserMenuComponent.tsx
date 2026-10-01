"use client";

import { Feedback } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent";
import type { UserMenuProps } from "@/presentation/components/layout/UserMenu/UserMenuComponent.types";

export function UserMenu(props: Readonly<UserMenuProps>) {
	return <Feedback user={props} />;
}
