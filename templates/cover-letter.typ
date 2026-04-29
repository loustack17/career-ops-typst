#let data = json(sys.inputs.payload)

#import "./cv/config.typ": paper-size, body, page-margin, base-font, base-size, base-leading, text-dark, text-mid, summary-size, accent
#import "./cv/header.typ": render-header

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: base-font, size: base-size, fill: body)
#set par(justify: false, leading: base-leading)
#set block(spacing: 8pt)

#render-header(data.identity)

#text(size: summary-size, fill: text-mid)[#data.letter.date]

#v(10pt)

#text(size: summary-size, fill: text-dark)[#data.letter.recipient_name]
#for line in data.letter.recipient_lines [
  #text(size: summary-size, fill: text-dark)[#line]
]

#v(8pt)

#text(size: summary-size, fill: text-dark)[#data.letter.salutation]

#v(4pt)

#for paragraph in data.letter.body [
  #text(size: 8pt, fill: text-mid)[#paragraph]
  #v(5pt)
]

#text(size: summary-size, fill: text-dark)[#data.letter.closing]

#v(12pt)

#text(size: summary-size, fill: text-dark)[#data.identity.full_name]
