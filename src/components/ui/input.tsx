
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "minimal";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const baseClasses = "flex w-full file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
    
    const variantClasses = {
      default: "h-10 rounded-md border border-input bg-background px-3 py-2 text-base focus:border-blue-500 md:text-sm",
      minimal: "h-8 border-0 border-b border-gray-300 bg-transparent px-1 py-1 text-sm focus:border-blue-500 focus:border-b-2"
    };

    return (
      <input
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          // Hide number input spinners
          type === 'number' && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
