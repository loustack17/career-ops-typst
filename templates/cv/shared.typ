#import "./config.typ": accent, border, chip-border, chip-border-radius, chip-border-thickness, chip-fill, chip-padding-x, chip-padding-y, chip-text, chip-text-size, chip-text-weight, competency-chip-gap, competency-row-leading, heading-font, section-title-above, section-title-below, section-title-divider-gap, section-title-divider-height, section-title-size, section-title-tracking, section-title-weight

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
