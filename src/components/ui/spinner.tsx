"use client";

import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin shrink-0 text-primary", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
      xl: "size-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type SpinnerProps = ComponentProps<typeof Loader2> &
  VariantProps<typeof spinnerVariants>;

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn(spinnerVariants({ size }), className)}
      aria-hidden
      {...props}
    />
  );
}

type SpinnerBlockProps = {
  label?: string;
  spinnerSize?: VariantProps<typeof spinnerVariants>["size"];
  className?: string;
};

function SpinnerBlock({
  label,
  spinnerSize = "xl",
  className,
}: SpinnerBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={spinnerSize ?? "xl"} />
      {label ? (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      ) : null}
    </div>
  );
}

export { Spinner, SpinnerBlock, spinnerVariants };
