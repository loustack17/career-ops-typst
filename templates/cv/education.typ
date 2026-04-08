#import "./config.typ": cert-below, cert-header-gutter, cert-issuer-size, cert-title-size, cert-title-weight, cert-year-size, edu-below, edu-desc-size, edu-header-gutter, edu-institution-size, edu-institution-weight, edu-title-size, edu-title-weight, edu-year-size, muted, purple, text-dark, text-mid
#import "./shared.typ": render-section-title

#let render-education-item(item) = [
  #block(above: 0pt, below: edu-below)[
    #grid(
      columns: (1fr, auto),
      column-gutter: edu-header-gutter,
      [
        #text(size: edu-title-size, weight: edu-title-weight, fill: text-dark)[#item.title]
        #if item.institution != "" [
          #text(size: edu-institution-size, weight: edu-institution-weight, fill: purple)[ #item.institution]
        ]
      ],
      [
        #if item.year != "" [
          #text(size: edu-year-size, fill: muted)[#item.year]
        ]
      ],
    )
    #if item.description != "" [
      #text(size: edu-desc-size, fill: text-mid)[#item.description]
    ]
  ]
]

#let render-cert-item(cert) = [
  #block(above: 0pt, below: cert-below)[
    #grid(
      columns: (1fr, auto),
      column-gutter: cert-header-gutter,
      [
        #text(size: cert-title-size, weight: cert-title-weight, fill: text-dark)[#cert.title]
        #if cert.issuer != "" [
          #text(size: cert-issuer-size, fill: purple)[ #cert.issuer]
        ]
      ],
      [
        #if cert.year != "" [
          #text(size: cert-year-size, fill: muted)[#cert.year]
        ]
      ],
    )
  ]
]

#let render-education(items) = if items.len() > 0 [
  #render-section-title("EDUCATION")
  #for item in items [
    #render-education-item(item)
  ]
]

#let render-certifications(items) = if items.len() > 0 [
  #render-section-title("CERTIFICATIONS")
  #for cert in items [
    #render-cert-item(cert)
  ]
]
