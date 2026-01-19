import { cookies } from "next/headers";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/cards/AppSideBar";
import TopCard from "@/components/custom/cards/TopCard";
import { auth } from "@/auth";
import PanelWrapper from "@/components/custom/wrapper/PanelWrapper";
import PricingBanner from "@/components/custom/cards/PricingBanner";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const session = await auth();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex w-full p-6">
        <AppSidebar />
        <div className="flex flex-col w-full gap-3 relative flex-1">
          <TopCard user={session?.user} />
          <PricingBanner />
          <PanelWrapper>{children}</PanelWrapper>
        </div>
      </div>
    </SidebarProvider>
  );
}
