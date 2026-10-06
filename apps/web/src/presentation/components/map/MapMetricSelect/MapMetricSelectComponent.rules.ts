"use client";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import type { MapMetricSelectProps } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.types";
export function useMapMetricSelectRules({ value, options, onSelect }: MapMetricSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listId = useId();
	const close = () => {
		setIsOpen(false);
		triggerRef.current?.focus();
	};
	const select = (next: string) => {
		onSelect(next);
		close();
	};
	const toggle = () => setIsOpen((current) => !current);
	const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === "Escape" && isOpen) {
			event.preventDefault();
			event.stopPropagation();
			close();
			return;
		}
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		event.preventDefault();
		event.stopPropagation();
		if (!isOpen) {
			setIsOpen(true);
			return;
		}
		const buttons = Array.from(
			rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
		);
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		let next = (index + 1) % buttons.length;
		if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = buttons.length - 1;
		buttons[next]?.focus();
	};
	useEffect(() => {
		if (isOpen)
			rootRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
	}, [isOpen]);
	useEffect(() => {
		const outside = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		document.addEventListener("pointerdown", outside);
		return () => document.removeEventListener("pointerdown", outside);
	}, []);
	return {
		isOpen,
		rootRef,
		triggerRef,
		listId,
		select,
		toggle,
		handleKeys,
		selectedLabel: options.find((option) => option.value === value)?.label,
	};
}
