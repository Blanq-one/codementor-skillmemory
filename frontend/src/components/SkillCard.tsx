import { repoLabel, type Skill } from '../api/client'

export function SkillCard({ skill }: { skill: Skill }) {
  const used = skill.state === 'used'
  return (
    <article className={`skill skill--${skill.state}`}>
      <div className="skill__top">
        <span className="skill__state">{used ? 'used' : 'recalled · ignored'}</span>
        <span className="skill__source" title={`learned from: ${skill.source_repo}`}>
          learned from: {repoLabel(skill.source_repo)}
        </span>
      </div>
      <p className="skill__method">{skill.method}</p>
      {!used && skill.reason && (
        <div className="skill__reason">
          <b>rejected</b>
          {skill.reason}
        </div>
      )}
    </article>
  )
}
