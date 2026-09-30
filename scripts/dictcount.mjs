// Words of UI copy in the dictionaries (string values only), per top-level section.
// Usage: node scripts/dictcount.mjs
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu) ?? []).length

for (const locale of ["en", "fr"]) {
  const src = await readFile(fileURLToPath(new URL(`../src/i18n/dictionaries/${locale}.ts`, import.meta.url)), "utf8")
  const sections = {}
  let current = "(top)"
  for (const line of src.split("\n")) {
    const top = line.match(/^ {2}(\w+): \{/)
    if (top) current = top[1]
    // String values: "…" after a colon or inside arrays; skip quoted keys like "smart-contracts":
    for (const m of line.matchAll(/(?<!\w)"((?:[^"\\]|\\.)*)"(?!\s*:)/g)) {
      sections[current] = (sections[current] ?? 0) + words(m[1])
    }
  }
  const total = Object.values(sections).reduce((a, b) => a + b, 0)
  console.log(`${locale}: ${total} words · ${Object.entries(sections).map(([k, v]) => `${k} ${v}`).join(" · ")}`)
}
