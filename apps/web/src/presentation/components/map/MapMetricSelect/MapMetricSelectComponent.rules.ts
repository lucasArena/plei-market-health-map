"use client";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import {
	METRIC_SELECT_LABEL_CLASS,
	METRIC_SELECT_MENU_CLASS,
	METRIC_SELECT_ROOT_CLASS,
	METRIC_SELECT_TRIGGER_CLASS,
} from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.styles";
import type { MapMetricSelectProps } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.types";
export function useMapMetricSelectRules({
	value,
	options,
	disabled,
	variant = "field",
	onChange,
}: MapMetricSelectProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLFieldSetElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const id = useId();
	useEffect(() => {
		if (!open) return;
		menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
		function outside(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		}
		document.addEventListener("pointerdown", outside);
		return () => document.removeEventListener("pointerdown", outside);
	}, [open]);
	function close() {
		setOpen(false);
		triggerRef.current?.focus();
	}
	function choose(next: string) {
		onChange(next);
		close();
	}
	function keys(event: KeyboardEvent<HTMLFieldSetElement>) {
		if (event.key === "Escape" && open) {
			event.preventDefault();
			event.stopPropagation();
			close();
			return;
		}
		if (event.key === "Tab") {
			setOpen(false);
			return;
		}
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || disabled) return;
		event.preventDefault();
		if (!open) {
			setOpen(true);
			return;
		}
		const buttons = Array.from(
			menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
		);
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		let next = (index + 1) % buttons.length;
		if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = buttons.length - 1;
		buttons[next]?.focus();
	}
	return {
		rootRef,
		triggerRef,
		menuRef,
		id,
		open: open && !disabled,
		keys,
		choose,
		toggle: () => setOpen((current) => !current),
		selected: options.find((option) => option.value === value)?.label,
		classes: {
			root: METRIC_SELECT_ROOT_CLASS[variant],
			label: METRIC_SELECT_LABEL_CLASS[variant],
			trigger: METRIC_SELECT_TRIGGER_CLASS[variant],
			menu: METRIC_SELECT_MENU_CLASS[variant],
		},
	};
}
