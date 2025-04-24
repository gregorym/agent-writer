import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Cable, ListTree, Settings } from "lucide-react";
import { useParams } from "next/navigation";

export function NavMain() {
  const { slug } = useParams();

  const data = {
    navMain: [
      {
        title: "Articles",
        url: "",
        icon: ListTree,
      },
      {
        title: "Integrations",
        url: "integrations",
        icon: File,
      },
    ],
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={`/w/${slug}`} className="w-full">
              <SidebarMenuButton tooltip={"Articles"}>
                <ListTree />
                <span>Articles</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href={`/w/${slug}/integrations`} className="w-full">
              <SidebarMenuButton tooltip={"Integrations"}>
                <Cable />
                <span>Integrations</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href={`/w/${slug}/settings`} className="w-full">
              <SidebarMenuButton tooltip={"Settings"}>
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
