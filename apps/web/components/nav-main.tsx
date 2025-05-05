import Link from "next/link";
import { useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { trpc } from "@/trpc/client";
import {
  BookA,
  Cable,
  ChevronsUpDown,
  ListTree,
  Plus,
  Settings,
} from "lucide-react";
import { useParams } from "next/navigation";
import { CreateWebsiteForm } from "./create-website-form"; // Import the new form component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function NavMain() {
  const { slug } = useParams();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: websites } = trpc.websites.all.useQuery();
  const { data: website } = trpc.websites.get.useQuery({
    slug: slug as string,
  });

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    utils.websites.all.invalidate(); // Refetch the websites list
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-sidebar-accent"
            >
              <div className="flex items-center justify-between gap-2 w-full">
                {website?.name}
                <ChevronsUpDown className="size-4" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={"right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Websites
            </DropdownMenuLabel>

            <div className="w-full">
              {(websites ?? []).map((website) => (
                <Link
                  key={website.slug}
                  href={`/w/${website.slug}/`}
                  className="group flex w-full cursor-pointer items-center gap-x-2 rounded-md p-2 text-neutral-700 transition-all duration-75 hover:bg-neutral-200/50 active:bg-neutral-200/80"
                >
                  <span className="block truncate">{website.name}</span>
                </Link>
              ))}
              <DropdownMenuSeparator />
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <button
                    key="add"
                    className="group flex w-full cursor-pointer items-center gap-x-2 rounded-md p-2 text-neutral-700 transition-all duration-75 hover:bg-neutral-200/50 active:bg-neutral-200/80"
                  >
                    <Plus className="mx-1.5 size-4 text-neutral-500" />
                    <span className="block truncate">Create new website</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Website</DialogTitle>
                  </DialogHeader>
                  <CreateWebsiteForm onSuccess={handleCreateSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={`/w/${slug}/`} className="w-full">
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
            <Link href={`/w/${slug}/keywords`} className="w-full">
              <SidebarMenuButton tooltip={"Keywords"}>
                <BookA />
                <span>Keywords</span>
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
