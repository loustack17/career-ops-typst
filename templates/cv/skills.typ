#import "./config.typ": skill-category-size, skill-category-weight, skill-items-size, text-dark, text-mid
#import "./shared.typ": render-section-title

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
