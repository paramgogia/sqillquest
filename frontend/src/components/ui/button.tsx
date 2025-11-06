import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-pixel uppercase tracking-wider ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-4 border-current active:translate-y-1",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary))] hover:shadow-glow-primary hover:brightness-110 active:shadow-[0_2px_0_hsl(var(--primary))]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_6px_0_hsl(var(--destructive))] hover:brightness-110 active:shadow-[0_2px_0_hsl(var(--destructive))]",
        outline: "border-4 border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-[0_6px_0_hsl(var(--border))] active:shadow-[0_2px_0_hsl(var(--border))]",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(var(--secondary))] hover:shadow-glow-primary hover:brightness-110 active:shadow-[0_2px_0_hsl(var(--secondary))]",
        ghost: "border-0 hover:bg-muted hover:text-foreground shadow-none active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline border-0 shadow-none active:translate-y-0",
        quest: "bg-gradient-magic text-primary-foreground shadow-[0_6px_0_hsl(var(--primary))] hover:shadow-glow-primary hover:brightness-110 active:shadow-[0_2px_0_hsl(var(--primary))]",
        treasure: "bg-gradient-treasure text-card shadow-[0_6px_0_hsl(var(--pixel-orange))] hover:shadow-glow-gold hover:brightness-110 active:shadow-[0_2px_0_hsl(var(--pixel-orange))]",
        success: "bg-gradient-success text-card shadow-[0_6px_0_hsl(var(--accent))] hover:brightness-110 active:shadow-[0_2px_0_hsl(var(--accent))]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-[0.65rem]",
        lg: "h-14 px-8 py-3",
        xl: "h-16 px-10 py-4 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
