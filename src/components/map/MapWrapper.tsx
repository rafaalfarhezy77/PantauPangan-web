"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvincePriceData } from "./IndonesiaChoroplethMap";

interface MapWrapperProps {
  provincesData: ProvincePriceData[];
  nationalAverage: number | null;
  commodityName: string;
  level: "konsumen" | "produsen";
}

const DynamicMap = dynamic(() => import("./IndonesiaChoroplethMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] sm:h-[520px] rounded-2xl border border-cream-100 bg-cream-50/50 flex flex-col items-center justify-center p-6 gap-3">
      <Skeleton className="w-16 h-16 rounded-full bg-cream-100" />
      <Skeleton className="w-48 h-5 bg-cream-100" />
      <Skeleton className="w-72 h-4 bg-cream-100" />
      <p className="text-xs text-slate-400 mt-2">
        Memuat peta interaktif 38 provinsi Indonesia...
      </p>
    </div>
  ),
});

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicMap {...props} />;
}
