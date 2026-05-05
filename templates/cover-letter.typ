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
  left: 1.25in,
  right: 1.25in,
)

// === Fonts ===
#let body-font = ("Inter",)
#let name-font = ("Inter",)
#let name-size = 20pt
#let name-weight = 300
#let contact-size = 9.5pt
#let body-size = 10.5pt
#let contact-sep-gap = 5pt

// === Colors ===
#let text-color = rgb("#1a1a1a")
#let name-color = rgb("#1a1a1a")
#let contact-color = rgb("#555555")
#let contact-sep-color = rgb("#999999")

// ══════════════════════════════════════════
// COVER LETTER — IT industry standard format
// ══════════════════════════════════════════

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: body-font, size: body-size, fill: text-color)
#set par(justify: false, leading: 2pt, first-line-indent: 0pt)
#set block(spacing: 6pt, above: 0pt, below: 0pt)

// — Header: centered name, then pipe-separated contact row —
#align(center)[
  #block(below: 4pt)[
    #text(font: name-font, size: name-size, weight: name-weight, fill: name-color)[#identity.full_name]
  ]
  #block(below: 0pt)[
    #set text(font: body-font, size: contact-size, fill: contact-color)
    #for (index, contact) in identity.contacts.enumerate() [
      #if contact.href != "" [
        #link(contact.href)[#contact.display]
      ] else [
        #contact.display
      ]
      #if index + 1 < identity.contacts.len() [
        #h(contact-sep-gap)
        #text(fill: contact-sep-color)[|]
        #h(contact-sep-gap)
      ]
    ]
  ]
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
  #v(0.8em)
  #block(below: 0pt)[#paragraph]
]

// — Closing —
#v(0.8em)
#block(below: 0pt)[#data.letter.closing]

// — Typed name —
#v(2em)
#block(below: 0pt)[#identity.full_name]