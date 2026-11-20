import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[#27272A] bg-[#161616] text-[#A1A1AA] hover:bg-[#1f1f23] hover:text-white",
        secondary:
          "border-[#27272A] bg-[#111111] text-[#71717A] hover:text-[#A1A1AA]",
        destructive:
          "bg-[#FF495B]/10 text-[#FF495B] border border-[#FF495B]/20",
        outline: "border-[#27272A] text-[#71717A] bg-transparent",
        success:
          "bg-[#0FEDBE]/10 text-[#0FEDBE] border border-[#0FEDBE]/20",
        warning:
          "bg-[#161616] text-[#A1A1AA] border border-[#27272A]",
        gold:
          "bg-[#161616] text-white border border-[#27272A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
