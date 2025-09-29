import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

// const wait = () => new Promise((resolve) => setTimeout(resolve, 1000));

import "./dialog.css";

type Props = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export const Modal = ({ children, open, onOpenChange }: Props) => {
  return (
    <div>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Trigger />
        <Dialog.Portal>
          <Dialog.Overlay className="DialogOverlay" />
          <Dialog.Content className="DialogContent">
            <Dialog.Title />
            <Dialog.Description />
            <div>{children}</div>
            <Dialog.Close asChild>
              <button className="IconButton" aria-label="Close">
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
