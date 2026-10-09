export interface BreadcrumbItem {
	key: string;
	label: string;
	onSelect?: () => void;
}

export interface BreadcrumbProps {
	items: BreadcrumbItem[];
	label: string;
}
