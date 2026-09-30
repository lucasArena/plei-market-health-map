export interface PaginationProps {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	previousLabel: string;
	nextLabel: string;
	statusLabel: string;
}
