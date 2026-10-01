import { BadgeCheckIcon, HandCoinsIcon, LockIcon, SendIcon, Undo2Icon } from "lucide-react"

const ICONS = [LockIcon, SendIcon, BadgeCheckIcon, HandCoinsIcon]

/**
 * Lock → deliver → validate → release, with the refund branch. Flat orange line
 * art in HTML/CSS: horizontal on wide screens, vertical on phones.
 */
export function Lifecycle({
  steps,
  refund,
}: {
  steps: { title: string; body: string }[]
  refund: { title: string; body: string }
}) {
  return (
    <div>
      <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
        {/* The rail: vertical on phones, horizontal from md. */}
        <span aria-hidden="true" className="absolute top-5 bottom-5 left-5 w-0.5 bg-primary md:top-5 md:right-[12.5%] md:bottom-auto md:left-[12.5%] md:h-0.5 md:w-auto" />
        {steps.map((s, i) => {
          const Icon = ICONS[i] ?? LockIcon
          return (
            <li key={s.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                <Icon className="size-[18px] text-foreground" aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow text-primary-ink">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground md:mx-auto md:max-w-[24ch]">{s.body}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-8 flex gap-4 rounded-2xl border border-dashed p-5 md:mx-auto md:max-w-2xl md:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-input">
          <Undo2Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-bold">{refund.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{refund.body}</p>
        </div>
      </div>
    </div>
  )
}
