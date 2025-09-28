"use client";

import type { User } from "next-auth";
import { useRouter } from "next/navigation";

import { PlusIcon } from "@/components/icons";
import { NamespaceHistory } from "@/components/namespace-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Namespace } from "@/lib/db/schema";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function NamespaceSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();

  // const { data: namespaces } = useSWR<Array<Namespace>>(
  //   user ? `/api/namespace?userID=${user.id}` : undefined,
  //   fetcher,
  // );

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <Link href="/" className="flex flex-row items-center gap-3">
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                Namespace
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="h-8 p-1 md:h-fit md:p-2"
                  onClick={() => {
                    router.push("/namespace");
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="hidden md:block">
                New Namespace
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NamespaceHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
