"use client";

import { type ReactNode, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  GlobeIcon,
  LockIcon,
} from "./icons";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { Namespace } from "@/lib/db/schema";
import { MultiResponse } from "@/lib/types";
import { saveNamespaceAsCookie } from "@/app/(chat)/actions";

// export type VisibilityType = "private" | "public";

export function NamespaceSelector({
  chatId,
  className,
  initNamespaceId,
  setSelectedNamespaceIdAction,
}: {
  chatId: string;
  initNamespaceId?: string;
  setSelectedNamespaceIdAction: (v: string) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const { data } = useSWR<MultiResponse<Namespace>>(
    "/api/namespace?page_index=1&per_page=9999",
    fetcher,
  );
  const namespaces: Namespace[] = data && data?.objects ? data.objects : [];

  const [currentSelect, setCurrentSelect] = useState<Namespace | undefined>();
  useEffect(() => {
    if (initNamespaceId && namespaces) {
      const n = namespaces.find((v) => v.id === initNamespaceId);
      n && setCurrentSelect(n);
    }
  }, [initNamespaceId, namespaces]);

  useEffect(() => {
    if (currentSelect) {
      setSelectedNamespaceIdAction(currentSelect.id);
    }
  }, [currentSelect]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className,
        )}
      >
        <Button
          data-testid="visibility-selector"
          variant="outline"
          className="hidden h-8 md:flex md:h-fit md:px-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {currentSelect ? currentSelect.name : "no select"}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {namespaces.map((namespace) => (
          <DropdownMenuItem
            data-testid={`visibility-selector-item-${namespace.id}`}
            key={namespace.id}
            onSelect={() => {
              setCurrentSelect(namespace);
              setOpen(false);
              saveNamespaceAsCookie(chatId, namespace.id);
            }}
            className="group/item flex flex-row items-center justify-between gap-4"
            data-active={namespace.id === currentSelect?.id}
          >
            <div className="flex flex-col items-start gap-1">
              {namespace.name}
              {
                // visibility.description && (
                // <div className="text-muted-foreground text-xs">
                //   {visibility.description}
                // </div>
                // )
              }
            </div>
            <div className="text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
