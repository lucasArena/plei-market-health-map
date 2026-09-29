"use client";

import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAppVersion } from "@/infrastructure/app-version";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function useUserMenuRules() {
	const { messages } = useMessages();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const toggle = useCallback(() => setIsOpen((current) => !current), []);

	useEffect(() => {
		if (!isOpen) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};
		const closeOnOutsideClick = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		window.addEventListener("mousedown", closeOnOutsideClick);
		return () => {
			window.removeEventListener("keydown", closeOnEscape);
			window.removeEventListener("mousedown", closeOnOutsideClick);
		};
	}, [isOpen]);

	const versionLabel = formatMessage(messages.auth.version, { version: getAppVersion() });

	return { containerRef, isOpen, messages: messages.auth, toggle, versionLabel };
}
