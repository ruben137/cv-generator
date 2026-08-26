import { concept } from "./factory";

const family = ["nursing"] as const;

export const nursingConcepts = [
  concept({ id: "nursing-care", category: "skill", es: "Cuidados de enfermería", en: "Nursing care", families: [...family], esAliases: ["atención de enfermería", "cuidado de pacientes", "cuidados al paciente"], enAliases: ["patient care", "clinical nursing care"] }),
  concept({ id: "registered-nurse", category: "certification", es: "Enfermero titulado", en: "Registered nurse", families: [...family], esAliases: ["enfermera titulada", "licenciatura en enfermería", "licenciado en enfermería"], enAliases: ["RN", "registered professional nurse", "nursing license"] }),
  concept({ id: "vital-signs", category: "responsibility", es: "Control de signos vitales", en: "Vital signs monitoring", families: [...family], esAliases: ["toma de signos vitales", "monitoreo de signos vitales"], enAliases: ["vital signs", "monitor vital signs"] }),
  concept({ id: "medication-administration", category: "responsibility", es: "Administración de medicamentos", en: "Medication administration", families: [...family], esAliases: ["suministro de medicamentos", "administrar medicación"], enAliases: ["administer medications", "medicine administration"] }),
  concept({ id: "clinical-records", category: "responsibility", es: "Registros clínicos", en: "Clinical records", families: [...family], esAliases: ["historias clínicas", "documentación clínica", "expediente clínico"], enAliases: ["medical records", "clinical documentation", "patient records"] }),
  concept({ id: "infection-control", category: "methodology", es: "Control de infecciones", en: "Infection control", families: [...family], esAliases: ["prevención de infecciones", "bioseguridad"], enAliases: ["infection prevention", "clinical hygiene"] }),
  concept({ id: "patient-assessment", category: "responsibility", es: "Valoración del paciente", en: "Patient assessment", families: [...family], esAliases: ["evaluación del paciente", "valoración de pacientes"], enAliases: ["assess patients", "clinical assessment"] }),
  concept({ id: "triage", category: "responsibility", es: "Triaje", en: "Triage", families: [...family], esAliases: ["triage", "clasificación de pacientes"], enAliases: ["patient triage"] }),
  concept({ id: "wound-care", category: "responsibility", es: "Cuidado de heridas", en: "Wound care", families: [...family], esAliases: ["curación de heridas", "manejo de heridas"], enAliases: ["wound management", "dressing wounds"] }),
  concept({ id: "patient-education", category: "responsibility", es: "Educación al paciente", en: "Patient education", families: [...family], esAliases: ["orientación al paciente", "educación sanitaria"], enAliases: ["patient counselling", "health education"] }),
  concept({ id: "clinical-handoff", category: "responsibility", es: "Entrega de turno clínico", en: "Clinical handoff", families: [...family], esAliases: ["reporte de turno", "cambio de turno de enfermería"], enAliases: ["shift handoff", "nursing handover"] }),
  concept({ id: "cpr", category: "certification", es: "Reanimación cardiopulmonar", en: "Cardiopulmonary resuscitation", families: [...family], esAliases: ["RCP", "soporte vital básico"], enAliases: ["CPR", "basic life support", "BLS"] }),
] as const;
