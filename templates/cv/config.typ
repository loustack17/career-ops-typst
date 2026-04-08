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
