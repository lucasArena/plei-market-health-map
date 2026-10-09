import {
	BREADCRUMB_CURRENT_CLASS,
	BREADCRUMB_CURRENT_ITEM_CLASS,
	BREADCRUMB_EARLIER_ITEM_CLASS,
	BREADCRUMB_LINK_CLASS,
	BREADCRUMB_LIST_CLASS,
	BREADCRUMB_SEPARATOR_CLASS,
	BREADCRUMB_TEXT_CLASS,
} from "@/presentation/components/displays/InsightBreadcrumb/InsightBreadcrumbComponent.styles";
import type {
	BreadcrumbItem,
	BreadcrumbProps,
} from "@/presentation/components/displays/InsightBreadcrumb/InsightBreadcrumbComponent.types";

function EarlierCrumb({ item }: Readonly<{ item: BreadcrumbItem }>) {
	if (!item.onSelect) {
		return (
			<span title={item.title} className={BREADCRUMB_TEXT_CLASS}>
				{item.label}
			</span>
		);
	}
	return (
		<button
			type="button"
			title={item.title}
			onClick={item.onSelect}
			className={BREADCRUMB_LINK_CLASS}
		>
			{item.label}
		</button>
	);
}

export function Breadcrumb({ label, items, currentId }: Readonly<BreadcrumbProps>) {
	return (
		<nav aria-label={label}>
			<ol className={BREADCRUMB_LIST_CLASS}>
				{items.map((item, index) => {
					const isCurrent = index === items.length - 1;
					return (
						<li
							key={item.key}
							className={isCurrent ? BREADCRUMB_CURRENT_ITEM_CLASS : BREADCRUMB_EARLIER_ITEM_CLASS}
						>
							{index > 0 && (
								<span aria-hidden="true" className={BREADCRUMB_SEPARATOR_CLASS}>
									/
								</span>
							)}
							{isCurrent ? (
								<span
									id={currentId}
									aria-current="page"
									title={item.title}
									className={BREADCRUMB_CURRENT_CLASS}
								>
									{item.label}
								</span>
							) : (
								<EarlierCrumb item={item} />
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
