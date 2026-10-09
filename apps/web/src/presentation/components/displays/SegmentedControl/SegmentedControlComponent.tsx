import type { SegmentedControlProps } from "@/presentation/components/displays/SegmentedControl/SegmentedControlComponent.types";

export function SegmentedControl<Value extends string>({
	label,
	onChange,
	options,
	value,
}: Readonly<SegmentedControlProps<Value>>) {
	return (
		<fieldset
			aria-label={label}
			className="m-0 flex shrink-0 gap-0.5 rounded-md border-0 bg-[#f3f4f6] p-0.5"
		>
			{options.map((option) => {
				const isSelected = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						aria-pressed={isSelected}
						onClick={() => onChange(option.value)}
						className={`rounded px-2 py-[3px] text-[11px] leading-[13px] focus-visible:outline-2 ${isSelected ? "bg-white font-semibold text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "font-medium text-[#6b7280] hover:text-[#111827]"}`}
					>
						{option.label}
					</button>
				);
			})}
		</fieldset>
	);
}
