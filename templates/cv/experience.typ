#import "./config.typ": base-font, bullet-gutter, bullet-indent, bullet-size, heading-font, job-below, job-company-size, job-company-weight, job-header-gutter, job-period-size, job-role-bullets-gap, job-role-size, job-role-weight, muted, purple, text-dark, text-mid
#import "./shared.typ": render-section-title

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
