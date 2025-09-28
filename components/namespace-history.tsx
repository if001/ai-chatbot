"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Namespace } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import type { MultiResponse } from "@/lib/types";
import { NamespaceItem } from "./namespace-item";
import useSWRInfinite from "swr/infinite";
import { LoaderIcon } from "./icons";

const PAGE_SIZE: number = 20;

export function getNamespaceHistoryPaginationKey(
  pageIndex: number,
  previousPageData: MultiResponse<Namespace>,
) {
  if (previousPageData && !previousPageData.has_more) return null;

  return `/api/namespace?page_index=${pageIndex + 1}&per_page=${PAGE_SIZE}`;
}

export function NamespaceHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const {
    data: paginatedNamespaceHistory,
    setSize,
    isValidating,
    isLoading,
    mutate,
    error,
  } = useSWRInfinite<MultiResponse<Namespace>>(
    getNamespaceHistoryPaginationKey,
    fetcher,
    {
      fallbackData: [],
    },
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedNamespaceHistory
    ? paginatedNamespaceHistory.some((page) => page.has_more === false)
    : false;

  const hasEmptyNamespaceHistory = paginatedNamespaceHistory
    ? paginatedNamespaceHistory.every((page) => page.objects.length === 0)
    : false;

  const handleDelete = async () => {
    // const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
    //   method: "DELETE",
    // });
    // toast.promise(deletePromise, {
    //   loading: "Deleting chat...",
    //   success: () => {
    //     mutate((chatHistories) => {
    //       if (chatHistories) {
    //         return chatHistories.map((chatHistory) => ({
    //           ...chatHistory,
    //           chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
    //         }));
    //       }
    //     });
    //     return "Chat deleted successfully";
    //   },
    //   error: "Failed to delete chat",
    // });
    // setShowDeleteDialog(false);
    // if (deleteId === id) {
    //   router.push("/");
    // }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="flex h-8 items-center gap-2 rounded-md px-2"
              >
                <div
                  className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyNamespaceHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedNamespaceHistory &&
              (() => {
                const history = paginatedNamespaceHistory.flatMap((history) => {
                  return history.objects;
                });

                return (
                  <div className="flex flex-col gap-6">
                    {history.length > 0 && (
                      <div>
                        {history.map((namespace) => (
                          <NamespaceItem
                            key={namespace.id}
                            namespace={namespace}
                            isActive={namespace.id === id}
                            onDelete={(namespaceID) => {
                              setDeleteId(namespaceID);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd && !error) {
                setSize((size) => size + 1);
              }
            }}
          />

          {hasReachedEnd ? (
            <div className="mt-8 flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
              You have reached the end of your chat history.
            </div>
          ) : (
            <div className="mt-8 flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Namespace...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
