import { ClerkProvider } from "@clerk/nextjs";
import { getMessages } from "@market-health-map/i18n";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders/AppProvidersComponent";
import { CLERK_APPEARANCE } from "@/lib/clerk/clerk-appearance";
import { getClerkLocalization } from "@/lib/clerk/clerk-localization";
import { getRequestLocale } from "@/server/i18n/get-request-locale";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
	const { common } = getMessages(await getRequestLocale());
	return {
		title: common.appName,
		description: common.appDescription,
		manifest: "/manifest.webmanifest",
		icons: {
			icon: "/icons/icon-512.png",
			apple: "/icons/icon-512.png",
		},
		appleWebApp: {
			capable: true,
			title: common.appName,
			statusBarStyle: "default",
		},
	};
}

export const viewport: Viewport = {
	themeColor: "#ffffff",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getRequestLocale();
	return (
		<ClerkProvider
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
			afterSignOutUrl="/sign-in"
			localization={getClerkLocalization(locale)}
			appearance={{
				cssLayerName: "clerk",
				...CLERK_APPEARANCE,
			}}
		>
			<html lang={locale}>
				<body className={`${inter.variable} font-sans antialiased`}>
					<AppProviders locale={locale} messages={getMessages(locale)}>
						{children}
					</AppProviders>
				</body>
			</html>
		</ClerkProvider>
	);
}
