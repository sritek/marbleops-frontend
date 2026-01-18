import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Button variants following MarbleOps Design System
 * - Primary: Main action (ONE per screen) - slate gray
 * - Secondary: Safe/neutral actions
 * - Ghost: Low-priority actions
 * - Destructive: Delete/deactivate actions
 * - Accent: High-visibility CTAs - amber
 */
const buttonVariants = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
  secondary:
    "bg-bg-surface text-text-primary border border-border-subtle hover:bg-bg-muted active:bg-bg-muted",
  ghost:
    "bg-transparent text-text-primary hover:bg-bg-muted active:bg-bg-muted",
  destructive:
    "bg-error text-white hover:bg-red-700 active:bg-red-800",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700",
  link: "bg-transparent text-primary-600 hover:text-primary-700 hover:underline p-0 h-auto",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm", // 44px min touch target
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: keyof typeof buttonVariants;
  /** Button size */
  size?: keyof typeof buttonSizes;
  /** Render as child component (for links styled as buttons) */
  asChild?: boolean;
  /** Loading state - disables button and shows spinner */
  isLoading?: boolean;
}

/**
 * Button component
 *
 * @example
 * <Button>Add Item</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button variant="accent">Create Invoice</Button>
 * <Button variant="secondary" size="sm">Cancel</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2",
          "rounded-lg font-medium",
          "transition-colors duration-150",
          // Focus ring (WCAG AA)
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          // Disabled state
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant and size
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span className="sr-only">Loading...</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonSizes };
