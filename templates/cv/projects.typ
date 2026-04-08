#import "./config.typ": accent, chip-fill, muted, project-badge-padding-x, project-badge-padding-y, project-badge-radius, project-badge-text-size, project-badge-text-weight, project-below, project-desc-size, project-header-gutter, project-tech-size, project-title-desc-gap, project-title-size, project-title-weight, purple, text-mid
#import "./shared.typ": render-section-title

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
