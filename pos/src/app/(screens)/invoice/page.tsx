import { Suspense } from "react";
import InvoiceSection from "@/components/custom/other/InvoiceSection";
import InvoiceSkeleton from "@/components/custom/skeleton/InvoiceSkeleton";

export default function InvoicePage() {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceSection />
    </Suspense>
  );
}
