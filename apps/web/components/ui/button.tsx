import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group select-none text-sm tracking-tight rounded-sm flex gap-1.5 items-center justify-center text-nowrap border transition-colors duration-75 fv-style disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-blue-500 border-transparent text-white [box-shadow:hsl(219,_93%,_30%)_0_-2px_0_0_inset,_hsl(219,_93%,_95%)_0_1px_3px_0] hover:bg-[hsl(219,_93%,_35%)] active:[box-shadow:none] hover:[box-shadow:none]",
        destructive:
          "bg-destructive text-white border-transparent hover:bg-destructive/90 [box-shadow:hsl(0,_84%,_30%)_0_-2px_0_0_inset,_hsl(0,_84%,_95%)_0_1px_3px_0] dark:[box-shadow:hsl(0,_84%,_30%)_0_-2px_0_0_inset,_hsl(0,_0%,_0%,_0.4)_0_1px_3px_0] hover:[box-shadow:none] dark:hover:[box-shadow:none]",
        outline:
          "border-input bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 [box-shadow:#aeb3bb_0_-2px_0_0_inset,#aeb3bb_0_1px_3px_0] hover:bg-[#aeb3bb] active:[box-shadow:none] hover:[box-shadow:none]",
        secondary:
          "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80 [box-shadow:hsl(0,_0%,_30%)_0_-2px_0_0_inset,_hsl(0,_0%,_95%)_0_1px_3px_0] dark:[box-shadow:hsl(0,_0%,_30%)_0_-2px_0_0_inset,_hsl(0,_0%,_0%,_0.4)_0_1px_3px_0] hover:[box-shadow:none] dark:hover:[box-shadow:none]",
        ghost:
          "border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary border-transparent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 pl-2.5 pr-3 data-kbd:pr-1.5 w-full sm:w-fit",
        sm: "h-8 pl-2 pr-2.5 data-kbd:pr-1 w-full sm:w-fit",
        lg: "h-10 pl-3 pr-3.5 data-kbd:pr-2 w-full sm:w-fit",
        icon: "size-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
