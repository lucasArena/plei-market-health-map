import { RecentLogins } from "@/components/logins/RecentLogins/RecentLoginsComponent";

export default function AdoptionPage() {
	return (
		<div className="mx-auto w-full max-w-5xl p-6">
			<RecentLogins limit={50} />
		</div>
	);
}
