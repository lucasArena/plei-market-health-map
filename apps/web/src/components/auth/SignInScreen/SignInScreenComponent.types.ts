export interface SignInScreenProps {
	error: string | null;
	email: string | null;
	domain: string;
}

export interface GoogleButtonProps {
	label: string;
	pendingLabel: string;
}
