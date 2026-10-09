import * as React from "react"
import { cn } from "cn"
import { TriangleAlertIcon } from "lucide-react"

export interface DisclaimerProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /**
   * The disclaimer line. Keep it short and specific to the product, e.g.
   * "Testnet demo · not tax or accounting advice · no real funds".
   */
  text?: React.ReactNode
  /**
   * `inline` (default): a small muted line with a warning icon, for the
   * wallet prompt or next to a value-moving action. `banner`: a full-width
   * strip with a bottom border, for the top of a page or the app frame.
   */
  variant?: "inline" | "banner"
  /** Icon before the text. Default a warning triangle; `false` for none. */
  icon?: React.ReactNode | false
  /** Classes for the banner's inner row (max width, side padding). */
  containerClassName?: string
}

/**
 * The "simulated demo, no real funds" line Monark demos show once per
 * value-moving transaction, in the wallet prompt (brand guidelines §11).
 * The persistent "Demo · simulated data" notice belongs in the footer.
 */
function Disclaimer({
  text = "Testnet demo · not financial advice · no real funds",
  variant = "inline",
  icon,
  className,
  containerClassName,
  ...props
}: DisclaimerProps) {
  const banner = variant === "banner"
  const glyph =
    icon === false ? null : icon !== undefined ? (
      <span
        aria-hidden="true"
        data-slot="disclaimer-icon"
        className={cn("shrink-0 text-warning", banner ? "[&_svg]:size-4" : "mt-px [&_svg]:size-3.5")}
      >
        {icon}
      </span>
    ) : (
      <TriangleAlertIcon
        aria-hidden="true"
        data-slot="disclaimer-icon"
        className={cn("shrink-0 text-warning", banner ? "size-4" : "mt-px size-3.5")}
      />
    )

  if (banner) {
    return (
      <div
        data-slot="disclaimer"
        data-variant="banner"
        className={cn("border-b bg-muted/60", className)}
        {...props}
      >
        <p
          className={cn(
            "mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-foreground sm:px-6",
            containerClassName
          )}
        >
          {glyph}
          <span>{text}</span>
        </p>
      </div>
    )
  }

  return (
    <p
      data-slot="disclaimer"
      data-variant="inline"
      className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", className)}
      {...props}
    >
      {glyph}
      <span>{text}</span>
    </p>
  )
}

export { Disclaimer }
