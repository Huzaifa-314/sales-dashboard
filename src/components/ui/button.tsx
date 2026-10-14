import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

// The one button, in the shadcn/ui shape: variants through cva, and `asChild`
// to put the button's look on a link or any other element:
//   <Button asChild><Link href="/customers">Back</Link></Button>
//
// Our variant names are primary / secondary / ghost. shadcn's names are
// accepted too (default, outline, destructive, link), so components added from
// shadcn later work without edits.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control border text-body whitespace-nowrap transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-ink-faint aria-disabled:pointer-events-none aria-disabled:opacity-60 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary font-medium text-on-primary hover:border-primary-hover hover:bg-primary-hover",
        secondary:
          "border-field-border bg-transparent text-ink hover:bg-surface-2",
        ghost:
          "border-transparent bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink",
        // A soft red, not a loud one: destructive actions confirm in a dialog.
        destructive:
          "border-transparent bg-overdue-bg font-medium text-overdue hover:border-overdue",
        link: "min-h-0 border-transparent bg-transparent px-0 text-ink underline-offset-4 hover:underline",
        // shadcn aliases
        default:
          "border-primary bg-primary font-medium text-on-primary hover:border-primary-hover hover:bg-primary-hover",
        outline:
          "border-field-border bg-transparent text-ink hover:bg-surface-2",
      },
      size: {
        // md: the default 44px target. sm: dense rows (36px). icon: square 44px;
        // icon-sm: square 36px.
        md: "min-h-11 px-5",
        default: "min-h-11 px-5",
        sm: "min-h-9 px-3 text-caption font-medium",
        lg: "min-h-12 px-6",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      // Only a real <button> needs a type; a link must not get one.
      {...(asChild ? {} : { type })}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Kept for triggers that take a className (menu triggers).
export function buttonClass(
  variant: VariantProps<typeof buttonVariants>["variant"] = "secondary",
  size: VariantProps<typeof buttonVariants>["size"] = "md",
  className = "",
) {
  return cn(buttonVariants({ variant, size }), className);
}
