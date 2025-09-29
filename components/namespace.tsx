"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import type { Session } from "next-auth";
import type { VisibilityType } from "./visibility-selector";

import { NameSpaceHeader } from "@/components/namespace-header";
import DocTable from "@/components/doc-table";
import { fetcher, fetcherPost } from "@/lib/utils";
import { fileResponse, MultiResponse, NamespaceRequest } from "@/lib/types";
import { Resources, NamespaceWithResources } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { LoaderIcon, UploadDocIcon } from "./icons";
import { PopoverContent } from "./elements/popover";
import { Modal } from "./elements/modal";
import { DocumentSkeleton, InlineSkeleton } from "./document-skeleton";

interface FileRequest {
  arg: { formData: FormData };
}
export default function NameSpace({
  id,
  session,
}: {
  id: string;
  session: Session;
}) {
  const [openModal, setOpenModal] = useState(false);
  const [modalContent, setModalContent] = useState<string | undefined>();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [resources$response, setResources$response] = useState<Resources[]>([]);
  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles: File[]) => {
      console.log("acceptedFiles", acceptedFiles);
      setSelectedFiles(acceptedFiles);
    },
    multiple: true,
  });

  const { data: namespaces$default, isLoading } =
    useSWR<NamespaceWithResources>(`/api/namespace/${id}`, fetcher);

  const {
    trigger: trigger$files,
    isMutating: isMutating$files,
    error: error$files,
  } = useSWRMutation("/api/file", async (url, { arg }: FileRequest) => {
    return fetch(url, { method: "POST", body: arg.formData })
      .then((r) => r.json())
      .then((r) => fileResponse.parse(r));
  });
  const {
    trigger: trigger$namespace,
    isMutating: isMutating$namespace,
    error: error$namespace,
  } = useSWRMutation(
    `/api/namespace/${id}`,
    fetcherPost<NamespaceRequest, MultiResponse<Resources>>,
  );

  //useSWR("/api/file", fetcher);
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      console.log("append", selectedFiles[i]);
      formData.append(`file`, selectedFiles[i]);
    }
    const response$file = await trigger$files({ formData });
    setSelectedFiles([]);
    const fileIDs = response$file.okFiles.map((f) => f.name!!);

    if (fileIDs.length == 0) {
      console.log("no new file...");
      return;
    }

    const response = await trigger$namespace({
      body: {
        fileIds: fileIDs,
      },
    });
    setResources$response(response.objects);
  };

  const resources = useMemo(() => {
    if (resources$response && namespaces$default) {
      return [...resources$response, ...namespaces$default.resources];
    }
    if (resources$response) {
      return [...resources$response];
    }
    return [];
  }, [namespaces$default, resources$response]);

  const getActiveStyle = (isActive: boolean) => {
    return isActive
      ? "border-gray-800 focus:outline-none ring-2 ring-indigo-500 ring-offset-2"
      : "border-gray-300";
  };

  return (
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      <NameSpaceHeader />
      <div className="px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-2">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-600">
            {isLoading && <InlineSkeleton />}
            {namespaces$default && namespaces$default.name}
          </h2>

          {/* upload area */}
          <div className="mt-4 sm:mt-8 flex justify-center" {...getRootProps()}>
            <label
              className={`relative block w-full rounded-lg border-2 border-dashed p-6 sm:p-12 text-center hover:border-gray-400  cursor-pointer ${getActiveStyle(isDragActive)}`}
            >
              {isMutating$files && isMutating$namespace ? (
                <div className="animate-spin size-[40px]!">
                  <LoaderIcon size={40} />
                </div>
              ) : (
                <UploadDocIcon />
              )}
              <input
                {...getInputProps({
                  onClick: (event) => event.stopPropagation(),
                })}
              />
              <div className="mt-2 sm:mt-2 block text-xs sm:text-sm font-semibold text-gray-400">
                Drag and drop or click to select files to upload
              </div>
            </label>
          </div>

          <div className="mt-4 sm:mt-8 flex justify-end">
            <button
              className="rounded-md bg-indigo-500 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-center text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              onClick={handleUpload}
            >
              Upload files
            </button>
          </div>
          <span className="mt-2 sm:mt-2 block text-xs sm:text-sm font-semibold text-gray-600">
            {resources.length > 0 &&
              resources.map((resource) => {
                return (
                  <>
                    <div
                      className="pb-2"
                      onClick={() => {
                        setOpenModal(true);
                        setModalContent(resource.content);
                      }}
                    >
                      {resource.name}, {resource.summary}
                      {resource.createdAt.toString()}
                    </div>
                  </>
                );
              })}
            {isLoading && <DocumentSkeleton />}
          </span>
        </div>
      </div>
      <Modal
        open={openModal}
        onOpenChange={(v) => {
          setOpenModal(v);
          setModalContent(undefined);
        }}
      >
        <div className="overflow-y-scroll text-gray-600 p-8 h-[80vh] bg-white rounded-md border-2 border-gray-400">
          {modalContent}
        </div>
      </Modal>
    </div>
  );
}
