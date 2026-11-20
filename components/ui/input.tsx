import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3.5 py-2 text-white placeholder:text-[#71717A] text-sm shadow-xs transition-colors duration-200 outline-none focus:border-[#3F3F46] focus:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
