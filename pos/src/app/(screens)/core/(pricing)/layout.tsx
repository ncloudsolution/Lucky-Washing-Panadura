"use client";
import { posFrontend } from "@/data/frontendRoutes";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-full w-full text-sm overflow-x-auto no-scrollbar">
      <div className="flex font-semibold gap-8 text-[30px] mb-5 pb-1 italic border-b-2 min-w-7xl">
        <Link
          href={posFrontend.pricingOverview}
          className={`${
            pathname !== posFrontend.pricingOverview &&
            "text-muted-foreground opacity-40"
          }`}
        >
          Overview
        </Link>
        <Link
          href={posFrontend.pricingHistory}
          className={`${
            pathname !== posFrontend.pricingHistory &&
            "text-muted-foreground opacity-40"
          }`}
        >
          Payment History
        </Link>
      </div>
      <div className="min-w-7xl h-full">{children}</div>
    </div>
  );
}
