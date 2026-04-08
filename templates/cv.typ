#let data = json(sys.inputs.payload)

#import "./cv/config.typ": paper-size, body, page-margin, base-font, base-size, base-leading, summary-size, text-dark
#import "./cv/header.typ": render-header
#import "./cv/shared.typ": render-section-title, render-competencies
#import "./cv/experience.typ": render-experience
#import "./cv/projects.typ": render-projects
#import "./cv/education.typ": render-education, render-certifications
#import "./cv/skills.typ": render-skills

#set page(
  width: paper-size(data.meta.paper_size).width,
  height: paper-size(data.meta.paper_size).height,
  margin: page-margin,
)

#set text(font: base-font, size: base-size, fill: body)
#set par(justify: false, leading: base-leading)
#set block(spacing: base-leading)

#render-header(data.identity)

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
