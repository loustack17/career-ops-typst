// === Data input ===
// Accepts: --input payload=path/to/payload.json (preferred)
//          or falls back to example payload
#let data-path = if "payload" in sys.inputs {
  sys.inputs.payload
} else {
  "../examples/cover-letter-payload.example.json"
}
#let data = json(data-path)

// Build identity from data if missing
#let identity = if "identity" in data {
  data.identity
} else {
  (
    full_name: data.meta.candidate_name,
    location: "",
    contacts: (),
  )
}

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════

// === Page ===
#let paper-size(kind) = if kind == "a4" {
  (width: 210mm, height: 297mm)
} else {
  (width: 8.5in, height: 11in)
}

#let page-margin = (
  top: 1in,
  bottom: 1in,
  left: 1in,
  right: 1in,
)

// === Fonts ===
#let body-font = ("Georgia",)
#let body-size = 11pt
#let body-leading = 2pt

// === Colors ===
#let text-color = rgb("#1a1a1a")

// ══════════════════════════════════════════
// COVER LETTER — NA business letter format (block style)
// ══════════════════════════════════════════

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: body-font, size: body-size, fill: text-color)
#set par(justify: false, leading: body-leading)
#set block(spacing: 0pt, above: 0pt, below: 0pt)

// — Sender block: name, then each contact on its own line —
#block(below: 0pt)[
  #text(weight: 700)[#identity.full_name]
]
#for contact in identity.contacts [
  #block(below: 0pt)[#contact.display]
]
#if identity.location != "" [
  #block(below: 0pt)[#identity.location]
]

// — Date —
#v(1em)
#block(below: 0pt)[#data.letter.date]

// — Recipient block —
#v(1em)
#for line in data.letter.recipient_lines [
  #block(below: 0pt)[#line]
]

// — Salutation —
#v(1em)
#block(below: 0pt)[#data.letter.salutation]

// — Body paragraphs —
#for paragraph in data.letter.body [
  #v(1em)
  #block(below: 0pt)[#paragraph]
]

// — Closing —
#v(1em)
#block(below: 0pt)[#data.letter.closing]

// — Typed name —
#v(2em)
#block(below: 0pt)[#identity.full_name]