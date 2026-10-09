"use client";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import {
	METRIC_SELECT_LABEL_CLASS,
	METRIC_SELECT_MENU_CLASS,
	METRIC_SELECT_ROOT_CLASS,
	METRIC_SELECT_TRIGGER_CLASS,
} from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.styles";
import type {
	MapMetricSelectProps,
	MapMetricSubmenu,
} from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.types";
export function useMapMetricSelectRules({
	value,
	options,
	disabled,
	variant = "field",
	onChange,
}: MapMetricSelectProps) {
	const [submenu, setSubmenu] = useState<MapMetricSubmenu | null>(null);
	const submenuRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLFieldSetElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const id = useId();
	useEffect(() => {
		if (!open) return;
		menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
		function outside(event: PointerEvent) {
			if (
				!rootRef.current?.contains(event.target as Node) &&
				!submenuRef.current?.contains(event.target as Node)
			) {
				setOpen(false);
				setSubmenu(null);
			}
		}
		document.addEventListener("pointerdown", outside);
		return () => document.removeEventListener("pointerdown", outside);
	}, [open]);
	useEffect(() => {
		if (!submenu) return;
		submenuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
		if (!submenuRef.current?.contains(document.activeElement))
			submenuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
	}, [submenu]);
	function openSubmenu(next: string) {
		const button = Array.from(
			menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
		).find((button) => button.dataset.value === next);
		if (!button) return;
		const rect = button.getBoundingClientRect();
		setSubmenu({
			value: next,
			left: Math.max(8, rect.right + 168 < window.innerWidth ? rect.right + 4 : rect.left - 164),
			top: Math.min(rect.top, window.innerHeight - 120),
		});
	}
	function back() {
		const parent = submenu?.value;
		setSubmenu(null);
		Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
			.find((button) => button.dataset.value === parent)
			?.focus();
	}
	function close() {
		setOpen(false);
		setSubmenu(null);
		triggerRef.current?.focus();
	}
	function choose(next: string) {
		if (options.find((option) => option.value === next)?.children) {
			openSubmenu(next);
			return;
		}
		onChange(next);
		close();
	}
	function keys(event: KeyboardEvent<HTMLFieldSetElement>) {
		if (event.key === "ArrowRight" && open) {
			const next = (document.activeElement as HTMLButtonElement)?.dataset.value;
			if (options.find((option) => option.value === next)?.children) {
				event.preventDefault();
				openSubmenu(next as string);
			}
			return;
		}
		if ((event.key === "ArrowLeft" || event.key === "Escape") && submenu) {
			event.preventDefault();
			event.stopPropagation();
			back();
			return;
		}
		if (event.key === "Escape" && open) {
			event.preventDefault();
			event.stopPropagation();
			close();
			return;
		}
		if (event.key === "Tab") {
			setSubmenu(null);
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
			(submenu ? submenuRef.current : menuRef.current)?.querySelectorAll<HTMLButtonElement>(
				'[role="option"]',
			) ?? [],
		);
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		let next = (index + 1) % buttons.length;
		if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = buttons.length - 1;
		buttons[next]?.focus();
	}
	return {
		submenu,
		submenuRef,
		submenuOption: options.find((option) => option.value === submenu?.value),
		isSelected: (next: string) =>
			next === value ||
			!!options
				.find((option) => option.value === next)
				?.children?.some((child) => child.value === value),
		rootRef,
		triggerRef,
		menuRef,
		id,
		open: open && !disabled,
		keys,
		choose,
		toggle: () => {
			setSubmenu(null);
			setOpen((current) => !current);
		},
		selected:
			options.find((option) => option.value === value)?.label ??
			options
				.flatMap(
					(option) =>
						option.children?.map((child) => ({
							value: child.value,
							label: `${option.label} · ${child.label}`,
						})) ?? [],
				)
				.find((option) => option.value === value)?.label,
		classes: {
			root: METRIC_SELECT_ROOT_CLASS[variant],
			label: METRIC_SELECT_LABEL_CLASS[variant],
			trigger: METRIC_SELECT_TRIGGER_CLASS[variant],
			menu: METRIC_SELECT_MENU_CLASS[variant],
		},
	};
}
