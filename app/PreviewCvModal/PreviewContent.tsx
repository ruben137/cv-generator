import React, { useEffect, useRef } from "react";
import {
  CvData,
  MainSectionId,
  mainSectionIds,
  normalizeContentOrder,
} from "../types";
import { defaultDocumentLabels } from "../cv-data";
import { CSSProperties } from "@mui/material";
import { useTranslations } from "next-intl";
interface IPreviewContentProps {
  previewData: CvData;
}
const fontOptions = [
  { value: "sans", labelKey: "fontSans", css: "Arial, Helvetica, sans-serif" },
  {
    value: "humanist",
    labelKey: "fontHumanist",
    css: "Calibri, Candara, Arial, sans-serif",
  },
  {
    value: "serif",
    labelKey: "fontSerif",
    css: "Georgia, 'Times New Roman', serif",
  },
] as const;
const PreviewContent = ({ previewData }: IPreviewContentProps) => {
  const t = useTranslations("App");
  const previewPaperRef = useRef<HTMLElement>(null);
  const hasContact = [
    previewData.phone,
    previewData.email,
    previewData.portfolio,
    previewData.location,
  ].some(Boolean);
  useEffect(() => {
    const paper = previewPaperRef.current;
    if (!paper) return;

    let frame = 0;
    let iteration = 0;
    const fitContent = () => {
      const paperScale =
        Number.parseFloat(
          getComputedStyle(paper).getPropertyValue("--paper-scale"),
        ) || 0.74;
      if (iteration === 0)
        paper.style.setProperty("--scale", String(paperScale));

      frame = requestAnimationFrame(() => {
        const columns = Array.from(
          paper.querySelectorAll<HTMLElement>(".cv-sidebar, .cv-main"),
        );
        const availableHeight = Math.max(paper.clientHeight, 1);
        const overflowRatio = Math.max(
          1,
          ...columns.map((column) => column.scrollHeight / availableHeight),
        );
        if (overflowRatio <= 1.002 || iteration >= 3) return;

        const currentScale =
          Number.parseFloat(
            getComputedStyle(paper).getPropertyValue("--scale"),
          ) || paperScale;
        paper.style.setProperty(
          "--scale",
          String(
            Math.max(paperScale * 0.68, (currentScale / overflowRatio) * 0.99),
          ),
        );
        iteration += 1;
        fitContent();
      });
    };

    fitContent();
    const handleResize = () => {
      cancelAnimationFrame(frame);
      iteration = 0;
      fitContent();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [previewData]);
  const previewDocumentLabels =
    defaultDocumentLabels[previewData.documentLocale];
  const previewContentOrder = normalizeContentOrder(
    previewData.contentOrder,
    previewData.sectionOrder,
    previewData.customSections,
  );
  const contrastHeadingStyle: CSSProperties | undefined =
    previewData.template === "contrast"
      ? {
          marginTop: "calc(12px * var(--scale))",
          marginBottom: "calc(6px * var(--scale))",
          padding: "0 0 calc(4px * var(--scale))",
          borderBottom: `1px solid ${previewData.primaryColor}`,
          background: "transparent",
          letterSpacing: "normal",
          textTransform: "none",
        }
      : undefined;
  const previewSectionLabel = (section: string) => {
    if (mainSectionIds.includes(section as MainSectionId)) {
      const mainSection = section as MainSectionId;
      return (
        previewData.sectionTitles[mainSection]?.trim() ||
        {
          summary: previewDocumentLabels.summary,
          experience: previewDocumentLabels.experience,
          education: previewDocumentLabels.education,
          certifications: previewDocumentLabels.certifications,
          skills: previewDocumentLabels.skills,
        }[mainSection]
      );
    }
    return (
      previewData.customSections
        .find((item) => item.id === section)
        ?.title.trim() || t("untitledSection")
    );
  };
  const skillItems = previewData.skills
    .map((skill) => skill.name.trim())
    .filter(Boolean);
  const renderMainSection = (section: string) => {
    if (!mainSectionIds.includes(section as MainSectionId)) {
      const custom = previewData.customSections.find(
        (item) => item.id === section,
      );
      if (!custom) return null;
      if (custom.type === "text") {
        return custom.text.trim() ? (
          <section key={section}>
            <h3 style={contrastHeadingStyle}>
              {custom.title || t("untitledSection")}
            </h3>
            <p>{custom.text}</p>
          </section>
        ) : null;
      }
      const items = custom.items.filter((item) => item.text.trim());
      return items.length ? (
        <section key={section}>
          <h3 style={contrastHeadingStyle}>
            {custom.title || t("untitledSection")}
          </h3>
          <ul className="cv-skills">
            {items.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </section>
      ) : null;
    }
    if (section === "summary") {
      return previewData.summary ? (
        <section key={section}>
          <h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>
          <p>{previewData.summary}</p>
        </section>
      ) : null;
    }
    if (section === "experience") {
      const items = previewData.experiences.filter(
        (item) => item.company || item.role,
      );
      return items.length ? (
        <section key={section}>
          <h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>
          {items.map((item, index) => (
            <div className="cv-experience" key={`${item.company}-${index}`}>
              <h4>
                {item.company}
                {item.company && item.role ? " — " : ""}
                <i>{item.role}</i>
              </h4>
              <p className="cv-meta">
                {[
                  item.location,
                  [item.start, item.end].filter(Boolean).join(" – "),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <ul>
                {item.bullets.filter(Boolean).map((bullet, bulletIndex) => (
                  <li key={bulletIndex}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null;
    }
    if (section === "education") {
      const items = previewData.education.filter(
        (item) => item.institution || item.degree,
      );
      return items.length ? (
        <section key={section}>
          <h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>
          {items.map((item, index) => (
            <div className="cv-experience" key={`${item.institution}-${index}`}>
              <h4>
                {item.institution}
                {item.institution && item.degree ? " — " : ""}
                <i>{item.degree}</i>
              </h4>
              <p className="cv-meta">
                {[
                  item.location,
                  [item.start, item.end].filter(Boolean).join(" – "),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </section>
      ) : null;
    }
    if (section === "certifications") {
      const items = previewData.certifications.filter(
        (item) => item.name || item.issuer,
      );
      return items.length ? (
        <section key={section}>
          <h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>
          {items.map((item, index) => (
            <div className="cv-experience" key={`${item.name}-${index}`}>
              <h4>{item.name}</h4>
              <p className="cv-meta">
                {[item.issuer, item.date].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </section>
      ) : null;
    }
    return skillItems.length ? (
      <section key={section}>
        <h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>
        <ul className="cv-skills">
          {skillItems.map((skill, index) => (
            <li key={`${skill}-${index}`}>{skill}</li>
          ))}
        </ul>
      </section>
    ) : null;
  };
  return (
    <div className='paper-wrap'>
      <article
        ref={previewPaperRef}
        className={`cv-paper template-${previewData.template}`}
        style={
          {
            "--cv-primary": previewData.primaryColor,
            "--cv-accent": previewData.accentColor,
            "--cv-font": fontOptions.find(
              (font) => font.value === previewData.fontFamily,
            )?.css,
          } as CSSProperties
        }
      >
        <aside
          className={`cv-sidebar cv-sidebar-${previewData.template}`}
          style={
            ["contrast", "editorial"].includes(previewData.template)
              ? { backgroundColor: previewData.primaryColor, color: "#fff" }
              : undefined
          }
        >
          <div className="top-accent" />
          <h2>{previewData.name || "Tu nombre"}</h2>
          {previewData.headline && (
            <p className="cv-headline">{previewData.headline}</p>
          )}
          {previewData.photo && (
            <img
              className={`cv-photo photo-${previewData.photoShape}`}
              src={previewData.photo}
              alt=""
            />
          )}
          {hasContact && (
            <section>
              <h3>
                {previewData.sectionTitles.contact?.trim() ||
                  previewDocumentLabels.contact}
              </h3>
              {previewData.location && (
                <p>
                  <b>
                    {previewData.sectionTitles.location?.trim() ||
                      previewDocumentLabels.location}
                    :
                  </b>
                  <br />
                  {previewData.location}
                </p>
              )}
              {previewData.phone && (
                <p>
                  <b>
                    {previewData.sectionTitles.phone?.trim() ||
                      previewDocumentLabels.phone}
                    :
                  </b>
                  <br />
                  {previewData.phone}
                </p>
              )}
              {previewData.email && (
                <p>
                  <b>
                    {previewData.sectionTitles.email?.trim() ||
                      previewDocumentLabels.email}
                    :
                  </b>
                  <br />
                  {previewData.email}
                </p>
              )}
              {previewData.portfolio && (
                <p>
                  <b>
                    {previewData.sectionTitles.portfolio?.trim() ||
                      previewDocumentLabels.portfolio}
                    :
                  </b>
                  <br />
                  {previewData.portfolio}
                </p>
              )}
            </section>
          )}
          {previewData.languages.some((language) => language.name) && (
            <section>
              <h3>
                {previewData.sectionTitles.languages?.trim() ||
                  previewDocumentLabels.languages}
              </h3>
              {previewData.languages
                .filter((language) => language.name)
                .map((language, index) => (
                  <p className="compact" key={`${language.name}-${index}`}>
                    <b>{language.name}:</b> {language.level}
                  </p>
                ))}
            </section>
          )}
        </aside>
        <main className={`cv-main cv-main-${previewData.template}`}>
          {previewContentOrder.map(renderMainSection)}
        </main>
        <div className="bottom-accent" />
      </article>
    </div>
  );
};

export default PreviewContent;
