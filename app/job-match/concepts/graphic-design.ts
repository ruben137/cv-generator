import { concept } from "./factory";

const family = ["graphic-design"] as const;

export const graphicDesignConcepts = [
  concept({ id: "graphic-design", category: "skill", es: "Diseño gráfico", en: "Graphic design", families: [...family], esAliases: ["diseño visual"], enAliases: ["visual design"] }),
  concept({ id: "adobe-photoshop", category: "tool", es: "Adobe Photoshop", en: "Adobe Photoshop", families: [...family], esAliases: ["Photoshop"], enAliases: ["Photoshop"] }),
  concept({ id: "adobe-illustrator", category: "tool", es: "Adobe Illustrator", en: "Adobe Illustrator", families: [...family], esAliases: ["Illustrator"], enAliases: ["Illustrator"] }),
  concept({ id: "adobe-indesign", category: "tool", es: "Adobe InDesign", en: "Adobe InDesign", families: [...family], esAliases: ["InDesign"], enAliases: ["InDesign"] }),
  concept({ id: "figma", category: "tool", es: "Figma", en: "Figma", families: [...family] }),
  concept({ id: "branding", category: "skill", es: "Identidad de marca", en: "Branding", families: [...family], esAliases: ["branding", "identidad visual"], enAliases: ["brand identity", "visual identity"] }),
  concept({ id: "typography", category: "skill", es: "Tipografía", en: "Typography", families: [...family], esAliases: ["diseño tipográfico"], enAliases: ["typographic design"] }),
  concept({ id: "color-theory", category: "skill", es: "Teoría del color", en: "Color theory", families: [...family], esAliases: ["manejo del color", "paleta de colores"], enAliases: ["color", "colour theory", "colour"] }),
  concept({ id: "layout-design", category: "skill", es: "Diseño editorial", en: "Layout design", families: [...family], esAliases: ["diagramación", "maquetación"], enAliases: ["editorial design", "page layout"] }),
  concept({ id: "visual-composition", category: "skill", es: "Composición visual", en: "Visual composition", families: [...family], esAliases: ["composición gráfica", "composición"], enAliases: ["composition", "graphic composition"], relations: [["layout-design", "related", 0.75]] }),
] as const;
