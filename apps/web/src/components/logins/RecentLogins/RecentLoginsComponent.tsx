"use client";

import { useRecentLoginsRules } from "@/components/logins/RecentLogins/RecentLoginsComponent.rules";
import type { RecentLoginsProps } from "@/components/logins/RecentLogins/RecentLoginsComponent.types";

export function RecentLogins(props: Readonly<RecentLoginsProps>) {
	const { messages, rows, status } = useRecentLoginsRules(props);
	const statusMessage = {
		loading: messages.loading,
		error: messages.failed,
		empty: messages.empty,
	};

	return (
		<section className="rounded-xl border bg-card p-6 shadow-sm" aria-labelledby="recent-logins">
			<h2 id="recent-logins" className="text-base font-semibold">
				{messages.title}
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">{messages.description}</p>
			{status === "ready" ? (
				<ul className="mt-4 divide-y">
					{rows.map((row) => (
						<li key={row.id} className="flex items-center justify-between py-2 text-sm">
							<span>{row.email}</span>
							<time dateTime={row.signedInAt} className="text-muted-foreground">
								{row.signedInLabel}
							</time>
						</li>
					))}
				</ul>
			) : (
				<p role="status" className="mt-4 text-sm text-muted-foreground">
					{statusMessage[status]}
				</p>
			)}
		</section>
	);
}
