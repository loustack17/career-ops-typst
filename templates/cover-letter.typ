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
// CONFIG — shared with cv-template.typ
// ══════════════════════════════════════════

// === Page ===
#let paper-size(kind) = if kind == "a4" {
  (width: 210mm, height: 297mm)
} else {
  (width: 8.5in, height: 11in)
}

#let page-margin = (
  top: 0.45in,
  bottom: 0.32in,
  left: 0.5in,
  right: 0.5in,
)

// === Colors ===
#let accent = rgb("#186b8c")
#let accent-2 = rgb("#9a7ae6")
#let body = rgb("#1a1a2e")
#let text-dark = rgb("#333333")
#let text-mid = rgb("#444444")
#let contact-color = rgb("#555555")
#let contact-separator-color = rgb("#cccccc")

// === Fonts ===
#let base-font = ("Inter",)
#let heading-font = ("Inter",)
#let base-size = 8.75pt
#let base-leading = 5.5pt

// === Header ===
#let header-name-size = 18pt
#let header-name-weight = 700
#let header-gradient-height = 1.5pt
#let header-gradient-split = 74%
#let header-name-divider-gap = 10pt
#let header-divider-contact-gap = 0.5pt
#let header-bottom-gap = 8pt
#let header-contact-size = 7.5pt
#let header-contact-separator-gap = 8pt

// === Cover letter ===
#let letter-date-size = 8.25pt
#let letter-body-size = 8pt
#let letter-closing-size = 8.25pt

// ══════════════════════════════════════════
// HEADER (shared with cv-template.typ)
// ══════════════════════════════════════════

#let render-contact-item(contact) = if contact.href != "" {
  link(contact.href)[#contact.display]
} else {
  [#contact.display]
}

#let render-header(identity) = block(above: 0pt, below: header-bottom-gap)[
  #block(below: header-name-divider-gap, above: 0pt)[
    #text(
      font: heading-font,
      size: header-name-size,
      weight: header-name-weight,
      fill: body,
    )[#identity.full_name]
  ]
  #grid(
    columns: (header-gradient-split, 100% - header-gradient-split),
    column-gutter: 0pt,
    box(width: 100%, height: header-gradient-height, fill: accent),
    box(width: 100%, height: header-gradient-height, fill: accent-2),
  )
  #v(header-divider-contact-gap)
  #set text(font: base-font, size: header-contact-size, fill: contact-color)
  #for (index, contact) in identity.contacts.enumerate() [
    #render-contact-item(contact)
    #if index + 1 < identity.contacts.len() or identity.location != "" [
      #h(header-contact-separator-gap)
      #text(fill: contact-separator-color)[|]
      #h(header-contact-separator-gap)
    ]
  ]
  #if identity.location != "" [
    #text(fill: contact-color)[#identity.location]
  ]
]

// ══════════════════════════════════════════
// COVER LETTER LAYOUT
// ══════════════════════════════════════════

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: base-font, size: base-size, fill: body)
#set par(justify: false, leading: base-leading)
#set block(spacing: 8pt)

#render-header(identity)

#text(size: letter-date-size, fill: text-mid)[#data.letter.date]

#v(10pt)

#text(size: letter-date-size, fill: text-dark)[#data.letter.recipient_name]
#for line in data.letter.recipient_lines [
  #block(above: 0pt, below: 0pt)[
    #text(size: letter-date-size, fill: text-dark)[#line]
  ]
]

#v(8pt)

#text(size: letter-date-size, fill: text-dark)[#data.letter.salutation]

#v(4pt)

#for paragraph in data.letter.body [
  #text(size: letter-body-size, fill: text-mid)[#paragraph]
  #v(5pt)
]

#text(size: letter-closing-size, fill: text-dark)[#data.letter.closing]

#v(12pt)

#text(size: letter-closing-size, fill: text-dark)[#identity.full_name]