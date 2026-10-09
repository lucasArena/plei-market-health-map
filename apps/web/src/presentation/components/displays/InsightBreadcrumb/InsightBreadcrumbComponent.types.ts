export interface BreadcrumbItem {
	key: string;
	label: string;
	/** Full name with its level, shown on hover since long names truncate. */
	title: string;
	/** Earlier crumbs navigate; the current crumb has no handler. */
	onSelect?: () => void;
}

export interface BreadcrumbProps {
	label: string;
	items: readonly BreadcrumbItem[];
	/** Id for the current crumb, e.g. so a heading can be described by it. */
	currentId?: string;
}
