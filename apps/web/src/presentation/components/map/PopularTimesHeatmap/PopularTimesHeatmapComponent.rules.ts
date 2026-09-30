export function edgeTooltipClass(index: number, count: number): string {
	const tooltipClass = {
		[`${true}`]: "left-1/2 -translate-x-1/2",
		[`${index === count - 1}`]: "right-0 left-auto translate-x-0",
		[`${index === 0}`]: "left-0 translate-x-0",
	}.true;
	return tooltipClass as string;
}
