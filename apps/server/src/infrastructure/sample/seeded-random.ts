export function hashSeed(value: string): number {
	let hash = 2166136261;
	for (const char of value) {
		hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
	}
	return hash >>> 0;
}

export function createSeededRandom(seed: string): () => number {
	let state = hashSeed(seed);
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function distribute(total: number, weights: number[]): number[] {
	const sum = weights.reduce((acc, weight) => acc + weight, 0) || 1;
	const exact = weights.map((weight) => (total * weight) / sum);
	const shares = exact.map(Math.floor);
	const remainder = total - shares.reduce((acc, share) => acc + share, 0);
	const byFraction = exact
		.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
		.sort((a, b) => b.fraction - a.fraction || a.index - b.index);
	const bumped = new Set(byFraction.slice(0, remainder).map((item) => item.index));
	return shares.map((share, index) => (bumped.has(index) ? share + 1 : share));
}
