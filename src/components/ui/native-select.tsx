import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

// A native <select> in the same pill shape as SelectTrigger. The browser's own
// arrow ignores padding and hugs the rounded edge, so it is hidden
// (appearance-none) and an inset chevron is drawn over the right padding.
// Use it where the OS picker is the better UX (long lists on phones, forms
// that must work without JS) or where Radix Select is too heavy.
function NativeSelect({
  className,
  size = "default",
  children,
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}) {
  return (
    <span
      data-slot="native-select-wrapper"
      data-size={size}
      className={cn(
        "group/native-select relative inline-flex w-fit min-w-0 has-[select:disabled]:opacity-50",
        className
      )}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "w-full min-w-0 cursor-pointer appearance-none truncate rounded-full border border-input bg-card pr-9 pl-4 text-sm font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:hover:bg-card aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>option]:bg-popover [&>option]:text-popover-foreground",
          size === "sm" ? "h-9 pr-8 pl-3.5" : "h-10",
          "pointer-coarse:h-11"
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        data-slot="native-select-icon"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground group-data-[size=sm]/native-select:right-3"
      />
    </span>
  )
}

function NativeSelectOption({ ...props }: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup({
  ...props
}: React.ComponentProps<"optgroup">) {
  return <optgroup data-slot="native-select-optgroup" {...props} />
}

export { NativeSelect, NativeSelectOption, NativeSelectOptGroup }
