import type { OfflineScreenProps } from "@/presentation/screens/OfflineScreen/OfflineScreenComponent.types";

export function OfflineScreen({ title, description }: Readonly<OfflineScreenProps>) {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background p-4 text-center">
			<h1 className="text-2xl font-semibold">{title}</h1>
			<p className="text-muted-foreground">{description}</p>
		</div>
	);
}
