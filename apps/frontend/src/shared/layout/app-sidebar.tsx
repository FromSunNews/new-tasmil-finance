"use client";

import { sidebarData } from "@/shared/layout/sidebar-data";
import { HeaderSidebar } from "@/shared/layout/header-sidebar";
import { NavGroup } from "@/shared/layout/nav-group";
import { FooterSidebarSection } from "@/shared/layout/footer-sidebar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/shared/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" side="left" variant="floating" {...props}>
      <SidebarHeader>
        <HeaderSidebar header={sidebarData.header} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((navGroup, index) => (
          <NavGroup key={index} {...navGroup} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <FooterSidebarSection />
      </SidebarFooter>
    </Sidebar>
  );
}
