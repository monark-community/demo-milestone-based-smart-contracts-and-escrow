"use client"

import * as React from "react"
import { cn } from "cn"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react"

type AccordionVariant = "default" | "plus"

const AccordionVariantContext = React.createContext<AccordionVariant>("default")

// `variant="plus"` is the Monark FAQ style from monark.io's homepage: rows
// divided by hairlines, large bold questions, an orange + that turns 45° into
// an × when open, and muted answers kept to a readable line length. Wrap it
// in `className="border-y"` for the framed list; items draw the lines between
// them. Panels animate with the theme's `animate-expand` utility.
function Accordion({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root> & {
  variant?: AccordionVariant
}) {
  return (
    <AccordionVariantContext.Provider value={variant}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        data-variant={variant}
        className={cn("group/accordion flex w-full flex-col", className)}
        {...props}
      />
    </AccordionVariantContext.Provider>
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const variant = React.useContext(AccordionVariantContext)
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        variant === "plus" ? "border-b last:border-b-0" : "not-last:border-b",
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  const variant = React.useContext(AccordionVariantContext)

  if (variant === "plus") {
    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            "group/accordion-trigger flex min-h-14 flex-1 items-center justify-between gap-4 rounded-lg py-3 text-left text-lg leading-snug font-bold text-foreground transition-colors duration-150 outline-none [text-wrap:pretty] hover:text-primary-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
          <PlusIcon
            data-slot="accordion-trigger-icon"
            aria-hidden
            className="pointer-events-none size-5 shrink-0 text-primary transition-transform duration-200 ease-out group-data-[state=open]/accordion-trigger:rotate-45 motion-reduce:transition-none"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    )
  }

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-4 rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          aria-hidden
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          aria-hidden
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const variant = React.useContext(AccordionVariantContext)
  const plus = variant === "plus"
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "animate-expand",
        plus ? "text-base text-muted-foreground" : "text-sm"
      )}
      {...props}
    >
      <div
        className={cn(
          plus
            ? "max-w-[68ch] pb-5 leading-relaxed [&_a]:text-primary-ink [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:text-foreground [&_p]:mb-2 [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
            : "pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:text-foreground [&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
