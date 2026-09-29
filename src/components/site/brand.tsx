import Image from "next/image"
import Link from "next/link"

/** The product brand (brand guidelines §2): butterfly mark + product name on one line. "by Monark" lives in the footer. */
export function Brand({ href, product, label }: { href: string; product: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-1">
      <Image src="/brand/monark-mark.svg" alt="" width={28} height={28} unoptimized priority className="size-7" />
      <span className="text-lg leading-none font-extrabold tracking-display text-foreground">{product}</span>
    </Link>
  )
}
