import { defaultDocumentLabels } from "./cv-data";
import { getInitialCv } from "./types";
import styles from "./simple-cv-example.module.css";

// Always show public sample content, never the user's live editor data.
export function SimpleCvExample({ locale }: { locale: string }) {
  const language = locale === "en" ? "en" : "es";
  const cv = getInitialCv(language);
  const labels = defaultDocumentLabels[language];
  const experience = cv.experiences[0];
  const education = cv.education[0];
  const title = language === "es" ? "Ejemplo de currículum sencillo" : "Simple resume example";
  const caption = language === "es"
    ? "Extracto del contenido de ejemplo. Sustituye los datos y las tareas por tu experiencia real en el editor."
    : "An excerpt of the sample content. Replace the details and tasks with your own experience in the editor.";

  return (
    <figure className={styles.example} aria-labelledby="simple-cv-example-title">
      <h2 id="simple-cv-example-title">{title}</h2>
      <div className={styles.paper}>
        <div className={styles.header}>
          <p className={styles.name}>{cv.name}</p>
          <p>{cv.headline}</p>
          <p className={styles.contact}>{cv.location} · {cv.email}</p>
        </div>
        <section>
          <h3>{labels.summary}</h3>
          <p>{cv.summary}</p>
        </section>
        <section>
          <h3>{labels.experience}</h3>
          <p><strong>{experience.role}</strong> · {experience.company}</p>
          <p>{experience.start} – {experience.end}</p>
          <ul>{experience.bullets.slice(0, 2).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
        </section>
        <section>
          <h3>{labels.education}</h3>
          <p><strong>{education.degree}</strong> · {education.institution}</p>
          <p>{education.start} – {education.end}</p>
        </section>
        <section>
          <h3>{labels.skills}</h3>
          <p>{cv.skills.slice(0, 3).map((skill) => skill.name).join(" · ")}</p>
        </section>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
