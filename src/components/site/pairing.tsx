import Image from "next/image"
import Link from "next/link"

/** The standard "{Product} by Monark" header pairing (brand guidelines §2). */
export function Pairing({ href, product, byMonark, label }: { href: string; product: string; byMonark: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="group flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-1">
      <Image src="/brand/monark-mark.svg" alt="" width={28} height={28} unoptimized priority className="size-7" />
      <span className="flex flex-col leading-none lg:flex-row lg:items-baseline lg:gap-1.5">
        <span className="text-lg font-extrabold tracking-tight text-foreground">{product}</span>
        <span className="mt-0.5 text-xs font-semibold text-muted-foreground lg:mt-0">
          <span aria-hidden="true" className="hidden lg:inline">
            ·{" "}
          </span>
          {byMonark}
        </span>
      </span>
    </Link>
  )
}
