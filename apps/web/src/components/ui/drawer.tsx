import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "cn";

import { Button } from "~/components/ui/button";
import { XIcon } from "lucide-react";

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerViewport({
  className,
  ...props
}: DrawerPrimitive.Viewport.Props) {
  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className={cn("fixed inset-0 isolate z-50", className)}
      {...props}
    />
  );
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "absolute inset-0 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: DrawerPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  const isBottom = side === "bottom";

  return (
    <DrawerPortal>
      <DrawerViewport>
        <DrawerOverlay />
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          data-side={side}
          className={cn(
            "z-50 flex flex-col bg-white text-sm shadow-xl outline-none duration-200",
            isBottom
              ? "absolute inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-2xl border-t border-[#E5E7EB] data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom"
              : "absolute top-0 right-0 h-full w-full max-w-md data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right",
            className,
          )}
          {...props}
        >
          {isBottom && (
            <div
              aria-hidden="true"
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-[#D1D5DB]"
            />
          )}
          <DrawerPrimitive.Content
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-4 p-5",
              isBottom && "pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4",
            )}
          >
            {children}
          </DrawerPrimitive.Content>
          {showCloseButton && (
            <DrawerPrimitive.Close
              data-slot="drawer-close"
              render={
                <Button
                  variant="ghost"
                  className="absolute top-3 right-3 bg-secondary"
                  size="icon-sm"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Tutup</span>
            </DrawerPrimitive.Close>
          )}
        </DrawerPrimitive.Popup>
      </DrawerViewport>
    </DrawerPortal>
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

export {
  Drawer,
  DrawerTrigger,
  DrawerViewport,
  DrawerOverlay,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
};
