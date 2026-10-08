"use client";

import Image from "next/image";
import Link from "next/link";
import { PLEI_LOGO_URL } from "@/application/constants/plei-logo";
import { useMapBrandRules } from "@/presentation/components/layout/MapBrand/MapBrandComponent.rules";
import { MAP_BRAND_CLASS } from "@/presentation/components/layout/MapBrand/MapBrandComponent.styles";

export function MapBrand() {
	const { label } = useMapBrandRules();

	return (
		<Link href="/" className={MAP_BRAND_CLASS}>
			<Image src={PLEI_LOGO_URL} alt="" width={16} height={16} />
			<p className="max-sm:sr-only text-[12px] font-semibold whitespace-nowrap text-foreground">
				{label}
			</p>
		</Link>
	);
}
