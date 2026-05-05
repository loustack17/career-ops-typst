// === Data input ===
// Accepts: --input payload=path/to/payload.json (preferred)
//          or falls back to example payload
#let data-path = if "payload" in sys.inputs {
  sys.inputs.payload
} else {
  "../examples/cv-typst-payload.example.json"
}
#let data = json(data-path)

// Build identity from data if missing (runtime payload may vary)
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
// CONFIG — colors, fonts, spacing
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
#let purple = rgb("#8f42c7")
#let body = rgb("#1a1a2e")
#let text-dark = rgb("#333333")
#let text-mid = rgb("#444444")
#let muted = rgb("#777777")
#let muted-2 = rgb("#888888")
#let border = rgb("#e5e5e5")
#let chip-fill = rgb("#eef8f9")
#let chip-border = rgb("#d7ebee")
#let chip-text = rgb("#125e76")
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

// === Section titles ===
#let section-title-size = 9.75pt
#let section-title-weight = 600
#let section-title-tracking = 0.5pt
#let section-title-divider-height = 0.75pt
#let section-title-above = 13pt
#let section-title-divider-gap = 4.5pt
#let section-title-below = 5pt

// === Competency chips ===
#let competency-chip-gap = 3pt
#let competency-row-leading = 4pt
#let chip-padding-x = 6pt
#let chip-padding-y = 3.5pt
#let chip-text-size = 7.5pt
#let chip-text-weight = 500
#let chip-border-thickness = 0.55pt
#let chip-border-radius = 2.2pt

// === Experience ===
#let job-below = 10pt
#let job-header-gutter = 6pt
#let job-company-size = 9.2pt
#let job-company-weight = 700
#let job-period-size = 7.5pt
#let job-role-size = 8.25pt
#let job-role-weight = 500
#let job-role-bullets-gap = 2pt
#let bullet-size = 7.875pt
#let bullet-indent = 7pt
#let bullet-gutter = 3.5pt

// === Projects ===
#let project-below = 10pt
#let project-header-gutter = 3pt
#let project-title-size = 8.25pt
#let project-title-weight = 700
#let project-badge-radius = 1.5pt
#let project-badge-padding-x = 4.5pt
#let project-badge-padding-y = 0.75pt
#let project-badge-text-size = 6.75pt
#let project-badge-text-weight = 500
#let project-title-desc-gap = 1.5pt
#let project-desc-size = 7.875pt
#let project-tech-size = 7.125pt

// === Education ===
#let edu-below = 7pt
#let edu-header-gutter = 5pt
#let edu-title-size = 8.25pt
#let edu-title-weight = 600
#let edu-institution-size = 8.25pt
#let edu-institution-weight = 500
#let edu-year-size = 7.5pt
#let edu-desc-size = 7.5pt

// === Certifications ===
#let cert-below = 0.75pt
#let cert-header-gutter = 5pt
#let cert-title-size = 7.875pt
#let cert-title-weight = 500
#let cert-issuer-size = 7.875pt
#let cert-year-size = 7.5pt

// === Skills ===
#let skill-category-size = 7.875pt
#let skill-category-weight = 600
#let skill-items-size = 7.875pt

// === Summary ===
#let summary-size = 8.25pt

// ══════════════════════════════════════════
// SHARED — section titles + chips
// ══════════════════════════════════════════

#let render-section-title(title) = block(width: 100%, above: section-title-above, below: section-title-below)[
  #stack(dir: ttb, spacing: section-title-divider-gap,
    text(font: heading-font, size: section-title-size, weight: section-title-weight, fill: accent, tracking: section-title-tracking)[#title],
    box(width: 100%, height: section-title-divider-height, fill: border),
  )
]

#let render-chip(label) = box(
  fill: chip-fill,
  stroke: (paint: chip-border, thickness: chip-border-thickness),
  radius: chip-border-radius,
  inset: (x: chip-padding-x, y: chip-padding-y),
)[
  #text(size: chip-text-size, weight: chip-text-weight, fill: chip-text)[#label]
]

#let render-competencies(items) = block(above: 0pt, below: 0pt)[
  #set par(leading: competency-row-leading)
  #for (index, item) in items.enumerate() [
    #render-chip(item)
    #if index + 1 < items.len() [
      #h(competency-chip-gap)
    ]
  ]
]

// ══════════════════════════════════════════
// HEADER
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
// EXPERIENCE
// ══════════════════════════════════════════

#let render-bullet(bullet) = [
  #grid(
    columns: (bullet-indent, 1fr),
    column-gutter: bullet-gutter,
    align: (left, top),
    [#text(font: base-font, size: bullet-size, fill: text-dark)[•]],
    [
      #text(font: base-font, size: bullet-size, fill: text-dark)[#bullet]
    ],
  )
]

#let render-job(job) = [
  #block(above: 0pt, below: job-below)[
    #grid(
      columns: (1fr, auto),
      column-gutter: job-header-gutter,
      [
        #text(font: heading-font, size: job-company-size, weight: job-company-weight, fill: purple)[
          #job.company#if job.location != "" [ -- #job.location]
        ]
      ],
      [
        #text(size: job-period-size, fill: muted)[#job.period]
      ],
    )
    #text(size: job-role-size, weight: job-role-weight, fill: text-mid)[#job.role]
    #v(job-role-bullets-gap)
    #for bullet in job.bullets [
      #render-bullet(bullet)
    ]
  ]
]

#let render-experience(items) = if items.len() > 0 [
  #render-section-title("WORK EXPERIENCE")
  #for job in items [
    #render-job(job)
  ]
]

// ══════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════

#let render-project(project) = [
  #block(above: 0pt, below: project-below)[
    #grid(
      columns: (1fr, auto),
      column-gutter: project-header-gutter,
      [
        #text(size: project-title-size, weight: project-title-weight, fill: purple)[#project.title]
      ],
      [
        #if project.badge != "" [
          #box(
            fill: chip-fill,
            radius: project-badge-radius,
            inset: (x: project-badge-padding-x, y: project-badge-padding-y),
          )[
            #text(size: project-badge-text-size, weight: project-badge-text-weight, fill: accent)[#project.badge]
          ]
        ]
      ],
    )
    #v(project-title-desc-gap)
    #if project.description != "" [
      #text(size: project-desc-size, fill: text-mid)[#project.description]
      #linebreak()
    ]
    #if project.tech != "" [
      #text(size: project-tech-size, fill: muted)[#project.tech]
    ]
  ]
]

#let render-projects(items) = if items.len() > 0 [
  #render-section-title("PROJECTS")
  #for project in items [
    #render-project(project)
  ]
]

// ══════════════════════════════════════════
// EDUCATION + CERTIFICATIONS
// ══════════════════════════════════════════

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

// ══════════════════════════════════════════
// SKILLS
// ══════════════════════════════════════════

#let render-skill(skill) = [
  #text(size: skill-category-size, weight: skill-category-weight, fill: text-dark)[#skill.category:]
  #h(4pt)
  #text(size: skill-items-size, fill: text-mid)[#skill.items.join(", ").]
  #linebreak()
]

#let render-skills(items) = if items.len() > 0 [
  #render-section-title("SKILLS")
  #block(above: 0pt, below: 0pt)[
    #for skill in items [
      #render-skill(skill)
    ]
  ]
]

// ══════════════════════════════════════════
// MASTER LAYOUT
// ══════════════════════════════════════════

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: base-font, size: base-size, fill: body)
#set par(justify: false, leading: base-leading)
#set block(spacing: base-leading)

#render-header(identity)

#if data.summary != "" [
  #render-section-title("PROFESSIONAL SUMMARY")
  #text(size: summary-size, fill: text-dark)[#data.summary]
]

#if data.core_competencies.len() > 0 [
  #render-section-title("CORE COMPETENCIES")
  #render-competencies(data.core_competencies)
]

#render-experience(data.experience)
#render-projects(data.projects)
#render-education(data.education)
#render-certifications(data.certifications)
#render-skills(data.skills)
