import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";

function Accordion({ ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-border last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionHeader({ ...props }: AccordionPrimitive.Header.Props) {
  return <AccordionPrimitive.Header data-slot="accordion-header" {...props} />;
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "flex w-full flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&[data-open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  );
}

function AccordionPanel({
  className,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-panel"
      className={cn(
        "overflow-hidden text-sm text-muted-foreground data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function AccordionPanelContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion-panel-content"
      className={cn("pt-0 pb-4", className)}
      {...props}
    />
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
  AccordionPanelContent,
};
