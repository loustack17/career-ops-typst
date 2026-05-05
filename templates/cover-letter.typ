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
  )
}

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════

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

// ══════════════════════════════════════════
// COVER LETTER — minimal, content-only
// ══════════════════════════════════════════

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: ("Inter",), size: 11pt, fill: rgb("#1a1a1a"))
#set par(justify: false, leading: 12pt, first-line-indent: 0pt)
#set block(spacing: 0pt, above: 0pt, below: 0pt)

// Salutation
#block(below: 0pt)[#data.letter.salutation]

// Gap before first body paragraph
#v(2em)

// Body paragraphs — 2em between paragraphs
#for paragraph in data.letter.body [
  #block(below: 2em)[#paragraph]
]

// Large gap before closing
#v(2.5em)
#block(below: 0pt)[#data.letter.closing]

// Name right below closing
#v(0.5em)
#block(below: 0pt)[#identity.full_name]