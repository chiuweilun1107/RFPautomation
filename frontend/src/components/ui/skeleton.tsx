import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-accent",
        "after:absolute after:inset-0",
        "after:translate-x-[-100%]",
        "after:animate-[shimmer_2s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
