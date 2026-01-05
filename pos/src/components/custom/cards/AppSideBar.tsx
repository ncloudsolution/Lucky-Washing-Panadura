"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { posFrontend } from "@/data/frontendRoutes";
import {
  Archive,
  Boxes,
  ChartNoAxesCombined,
  Settings,
  Users,
  Wallpaper,
  Warehouse,
  CircleDollarSign,
  Split,
} from "lucide-react";

const items = [
  { title: "POS", urls: [posFrontend.pos], icon: Wallpaper },
  { title: "Products", urls: [posFrontend.products], icon: Boxes },
  {
    title: "Dashboard",
    urls: [posFrontend.dashboard],
    icon: ChartNoAxesCombined,
  },
  {
    title: "Orders",
    urls: [posFrontend.orders, posFrontend.ordersHistory],
    icon: Archive,
  },
  {
    title: "Expenses",
    urls: [posFrontend.expenses],
    icon: Split,
  },
  { title: "Customers", urls: [posFrontend.customers], icon: Users },
  {
    title: "Options",
    urls: [posFrontend.optionsBarcodePrint, posFrontend.optionsConfigurations],
    icon: Settings,
  },
  {
    title: "Pricing",
    urls: [posFrontend.pricingOverview, posFrontend.pricingHistory],
    icon: CircleDollarSign,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar className={`bg-transparent ${isMobile && "border-0"} h-full`}>
      <SidebarContent className="py-6 pl-6 no-scrollbar h-full">
        <SidebarGroup className="bg-sidebar p-6 border border-sidebar-border rounded-md h-[3000px]">
          <SidebarGroupContent>
            <SidebarMenu className="gap-5">
              {items.map((item) => {
                const active = item.urls.some((url) =>
                  pathname.startsWith(url)
                );
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`${
                        active
                          ? "bg-superbase text-white hover:bg-superbase pointer-events-none"
                          : "hover:bg-secondary"
                      } size-20 flex-col item-center justify-center gap-0
                         [&>svg]:w-8 [&>svg]:h-8 border border-border-sidebar shadow-lg transition-all duration-500`}
                    >
                      <Link
                        href={item.urls[0]}
                        className="flex flex-col items-center justify-between"
                      >
                        <item.icon size={32} strokeWidth={1} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
