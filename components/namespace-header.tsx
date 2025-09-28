"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, VercelIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { memo } from "react";
import { type VisibilityType, VisibilitySelector } from "./visibility-selector";
import type { Session } from "next-auth";

function PureNameSpaceHeader() {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Button
          variant="outline"
          className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
          onClick={() => {
            router.push("/namespace");
            router.refresh();
          }}
        >
          <PlusIcon />
          <span className="md:sr-only">New Document</span>
        </Button>
      )}

      {
        // {!isReadonly && (
        //   <VisibilitySelector
        //     chatId={chatId}
        //     selectedVisibilityType={selectedVisibilityType}
        //     className="order-1 md:order-2"
        //   />
        // )}
      }

      <Button
        variant="ghost"
        type="button"
        className="order-3 hidden bg-zinc-900 px-2 text-zinc-50 hover:bg-zinc-800 md:ml-auto md:flex md:h-fit dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
      >
        chat
      </Button>
    </header>
  );
}

export const NameSpaceHeader = memo(PureNameSpaceHeader);
