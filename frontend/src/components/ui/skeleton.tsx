import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-accent/15",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-shimmer-brand",
        "before:bg-gradient-to-r before:from-transparent before:via-accent/50 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
