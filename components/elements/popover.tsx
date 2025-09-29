import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

type Props = {
  children: React.ReactNode;
  content: React.ReactNode;
};
export const PopoverContent = (props: Props) => {
  return (
    <Popover.Root modal={true}>
      <Popover.Trigger>{props.children}</Popover.Trigger>
      <Popover.Content className="PopoverContent" side="top">
        {props.content}
      </Popover.Content>
    </Popover.Root>
  );
};
