"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { Session } from "next-auth";
import type { VisibilityType } from "./visibility-selector";
import { useRouter } from "next/navigation";
import { NameSpaceHeader } from "@/components/namespace-header";
import DocTable from "@/components/doc-table";
import { fetcher, fetcherPost, nanoid } from "@/lib/utils";
import {
  fileResponse,
  MultiResponse,
  NamespaceRequest,
  NamespaceWithResources,
} from "@/lib/types";
import { Resources, Namespace, ResourceRequest } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";

interface MyFile {
  filename: string;
}

interface FileRequest {
  arg: { formData: FormData };
}

export default function NameSpace({ session }: { session: Session }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();
  const { getRootProps, getInputProps, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles: File[]) => {
      console.log("acceptedFiles", acceptedFiles);
      setSelectedFiles(acceptedFiles);
    },
    multiple: true,
  });

  // const { data: docs } = useSWR<Array<Resources>>(
  //   `/api/docs?namespaceID=${id}`,
  //   fetcher,
  // );

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
    "/api/namespace",
    fetcherPost<NamespaceRequest, NamespaceWithResources>,
  );

  //useSWR("/api/file", fetcher);
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append(`file`, selectedFiles[i]);
    }
    const response = await trigger$files({ formData });
    setSelectedFiles([]);
    const fileIDs = response.okFiles.map((f) => f.name!!);

    if (fileIDs.length == 0) {
      console.log("no new file...");
      return;
    }

    const namespaceResponse = await trigger$namespace({
      body: {
        name: nanoid(),
        fileIds: fileIDs,
      },
    });

    // setDocs(resourceResponse.objects);
    router.push(`/namespace/${namespaceResponse.id}`);
  };

  return (
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      <NameSpaceHeader />
      <div className="px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-48">
        <div className="mx-auto max-w-xl">
          {/* upload area */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-400">
            {" "}
            Creating namespaces
          </h2>

          <div className="mt-4 sm:mt-8 flex justify-center" {...getRootProps()}>
            {" "}
            <label className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 sm:p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer">
              {" "}
              <svg
                className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                />
              </svg>
              <input
                {...getInputProps({
                  onClick: (event) => event.stopPropagation(),
                })}
              />
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
          <span className="mt-2 sm:mt-2 block text-xs sm:text-sm font-semibold text-gray-400">
            {selectedFiles.length > 0
              ? selectedFiles.map((file) => file.name).join(", ")
              : "Drag and drop or click to select files to upload"}
          </span>
        </div>
      </div>
    </div>
  );
}
