#import "./config.typ": accent, accent-2, base-font, body, contact-color, contact-separator-color, heading-font, header-bottom-gap, header-contact-separator-gap, header-contact-size, header-divider-contact-gap, header-gradient-height, header-gradient-split, header-name-divider-gap, header-name-size, header-name-weight

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
