import { concept } from "./factory";

const family = ["software-development"] as const;

export const softwareDevelopmentConcepts = [
  concept({ id: "fullstack-development", category: "skill", es: "Desarrollo full-stack", en: "Full-stack development", families: [...family], esAliases: ["desarrollo full stack", "desarrollador full-stack", "programador full-stack"], enAliases: ["full stack development", "full-stack developer", "full stack engineer"], relations: [["frontend-development", "related", 0.65], ["backend-development", "related", 0.65]] }),
  concept({ id: "backend-development", category: "skill", es: "Desarrollo backend", en: "Backend development", families: [...family], esAliases: ["desarrollo back-end", "programación backend"], enAliases: ["back-end development", "backend engineering"], relations: [["python", "uses-tool", 0.6], ["django", "uses-tool", 0.65]] }),
  concept({ id: "version-control", category: "skill", es: "Control de versiones", en: "Version control", families: [...family], esAliases: ["versionado de código"], enAliases: ["source control"], relations: [["git", "uses-tool", 0.75]] }),
  concept({ id: "git", category: "tool", es: "Git", en: "Git", families: [...family], esAliases: ["GitHub", "GitLab", "Bitbucket"], enAliases: ["GitHub", "GitLab", "Bitbucket"], relations: [["version-control", "related", 0.75]] }),
  concept({ id: "code-review", category: "methodology", es: "Revisión de código", en: "Code review", families: [...family], esAliases: ["code review", "revisiones de código"], enAliases: ["code reviews", "peer review"] }),
  concept({ id: "git-workflow", category: "methodology", es: "Flujo de trabajo con Git", en: "Git workflow", families: [...family], esAliases: ["workflows de Git", "pull requests", "PRs", "branches"], enAliases: ["Git workflows", "pull requests", "PRs", "branches"], relations: [["git", "uses-tool", 0.7]] }),
  concept({ id: "frontend-development", category: "skill", es: "Desarrollo frontend", en: "Frontend development", families: [...family], esAliases: ["desarrollo front-end", "desarrollo de interfaces web"], enAliases: ["front-end development", "web UI development"], relations: [["react", "uses-tool", 0.65], ["typescript", "uses-tool", 0.6]] }),
  concept({ id: "react", category: "tool", es: "React", en: "React", families: [...family], esAliases: ["React.js", "ReactJS"], enAliases: ["React.js", "ReactJS"], relations: [["frontend-development", "related", 0.65]] }),
  concept({ id: "nextjs", category: "tool", es: "Next.js", en: "Next.js", families: [...family], esAliases: ["NextJS"], enAliases: ["NextJS"] }),
  concept({ id: "typescript", category: "tool", es: "TypeScript", en: "TypeScript", families: [...family], esAliases: [["TS", "abbreviation"]], enAliases: [["TS", "abbreviation"]] }),
  concept({ id: "python", category: "language", es: "Python", en: "Python", families: [...family], relations: [["django", "related", 0.7]] }),
  concept({ id: "django", category: "tool", es: "Django", en: "Django", families: [...family], relations: [["python", "uses-tool", 0.8]] }),
  concept({ id: "api-development", category: "skill", es: "Desarrollo de APIs", en: "API development", families: [...family], esAliases: ["API", "APIs", "integración de APIs", "servicios REST", "APIs REST", "construcción de APIs", "consumo de APIs"], enAliases: ["API", "APIs", "API integration", "REST services", "REST API", "building APIs", "consuming APIs"] }),
  concept({ id: "relational-databases", category: "skill", es: "Bases de datos relacionales", en: "Relational databases", families: [...family], esAliases: ["base de datos relacional", "diseño de schemas", "diseño de esquemas"], enAliases: ["relational database", "schema design"], relations: [["postgresql", "uses-tool", 0.8], ["mysql", "uses-tool", 0.8]] }),
  concept({ id: "postgresql", category: "tool", es: "PostgreSQL", en: "PostgreSQL", families: [...family], esAliases: ["Postgres"], enAliases: ["Postgres"], relations: [["relational-databases", "related", 0.8]] }),
  concept({ id: "mysql", category: "tool", es: "MySQL", en: "MySQL", families: [...family], relations: [["relational-databases", "related", 0.8]] }),
  concept({ id: "software-testing", category: "skill", es: "Pruebas de software", en: "Software testing", families: [...family], esAliases: ["testing", "pruebas automatizadas", "testing automatizado"], enAliases: ["automated testing", "test automation"], relations: [["jest", "uses-tool", 0.75], ["playwright", "uses-tool", 0.75]] }),
  concept({ id: "jest", category: "tool", es: "Jest", en: "Jest", families: [...family], relations: [["software-testing", "related", 0.75]] }),
  concept({ id: "playwright", category: "tool", es: "Playwright", en: "Playwright", families: [...family], relations: [["software-testing", "related", 0.75]] }),
  concept({ id: "docker", category: "tool", es: "Docker", en: "Docker", families: [...family] }),
  concept({ id: "continuous-integration", category: "methodology", es: "Integración y entrega continua", en: "Continuous integration and delivery", families: [...family], esAliases: ["CI/CD", "pipelines de CI/CD"], enAliases: ["CI/CD", "CI/CD pipelines"] }),
  concept({ id: "aws", category: "tool", es: "AWS", en: "AWS", families: [...family], esAliases: ["Amazon Web Services"], enAliases: ["Amazon Web Services"] }),
  concept({ id: "azure", category: "tool", es: "Azure", en: "Azure", families: [...family], esAliases: ["Microsoft Azure"], enAliases: ["Microsoft Azure"] }),
  concept({ id: "redis", category: "tool", es: "Redis", en: "Redis", families: [...family] }),
  concept({ id: "celery", category: "tool", es: "Celery", en: "Celery", families: [...family] }),
] as const;
