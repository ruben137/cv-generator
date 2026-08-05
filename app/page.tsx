"use client";

import {
  AddRounded,
  CheckCircleRounded,
  CloudOffRounded,
  ColorLensRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  DownloadRounded,
  ExpandMoreRounded,
  InsertDriveFileRounded,
  LanguageRounded,
  LockOutlined,
  OpenInNewRounded,
  PictureAsPdfRounded,
  RestartAltRounded,
  UploadRounded,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import { type CSSProperties, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { exportDocx, exportPdf, type ExportLabels } from "./exporters";
import { CvData, getInitialCv } from "./types";

const theme = createTheme({
  palette: {
    primary: { main: "#173B63", dark: "#0E2948" },
    background: { default: "#F4F6F8", paper: "#FFFFFF" },
    text: { primary: "#17202A", secondary: "#5E6A78" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    h4: { fontWeight: 760 },
    h6: { fontWeight: 720 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

const sectionSx = {
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "none",
  "&:before": { display: "none" },
  "& + &": { mt: 1.5 },
};

const colorPresets = [
  { nameKey: "paletteBlue", primary: "#173B63", accent: "#3C6596" },
  { nameKey: "paletteGreen", primary: "#174C3C", accent: "#4D806F" },
  { nameKey: "paletteWine", primary: "#6B2638", accent: "#A35D6A" },
  { nameKey: "palettePlum", primary: "#4C2E5F", accent: "#806294" },
  { nameKey: "paletteCharcoal", primary: "#263238", accent: "#607D8B" },
] as const;

function Counter({ value, max }: { value?: string; max: number }) {
  const length = value?.length ?? 0;
  return (
    <Typography component="span" variant="caption" color={length >= max ? "error" : "text.secondary"}>
      {length}/{max}
    </Typography>
  );
}

export default function Home() {
  const t = useTranslations("App");
  const locale = useLocale();
  const router = useRouter();
  const initialCv = getInitialCv(locale);
  const { control, register, reset, setValue } = useForm<CvData>({
    defaultValues: initialCv,
    mode: "onChange",
  });
  const data = useWatch({ control }) as CvData;
  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });
  const experiences = useFieldArray({ control, name: "experiences" });
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeSuccess, setNoticeSuccess] = useState(false);
  const exportLabels: ExportLabels = {
    summary: t("cvSummary"),
    experience: t("cvExperience"),
    skills: t("cvSkills"),
    contact: t("cvContact"),
    languages: t("cvLanguages"),
    location: t("location"),
    phone: t("phone"),
    email: t("email"),
    portfolio: t("portfolio"),
  };

  const changeLocale = (nextLocale: "es" | "en") => {
    if (nextLocale === locale) return;
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  const runExport = async (type: "pdf" | "docx") => {
    try {
      setExporting(type);
      setNotice("");
      setNoticeSuccess(false);
      if (type === "pdf") await exportPdf(data, exportLabels);
      else await exportDocx(data, exportLabels);
      setNotice(t("fileGenerated", { type: type.toUpperCase() }));
      setNoticeSuccess(true);
    } catch {
      setNotice(t("generationError"));
      setNoticeSuccess(false);
    } finally {
      setExporting(null);
    }
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2_000_000) {
      setNotice(t("imageError"));
      setNoticeSuccess(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue("photo", String(reader.result), { shouldDirty: true });
    reader.readAsDataURL(file);
  };

  const hasContact = [data.phone, data.email, data.portfolio, data.location].some(Boolean);
  const skillItems = data.skills.map((skill) => skill.name.trim()).filter(Boolean);
  const used = data.experiences.reduce(
    (total, item) => total + item.bullets.join("").length + item.company.length + item.role.length,
    data.summary.length + data.skills.reduce((total, skill) => total + skill.name.length, 0),
  );
  const spaceStatus = used > 1750 ? "high" : used > 1200 ? "medium" : "optimal";
  const localizedStatus =
    spaceStatus === "high" ? t("statusHigh") : spaceStatus === "medium" ? t("statusMedium") : t("statusOptimal");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="inherit" elevation={0} className="topbar">
        <Toolbar sx={{ minHeight: 68, gap: 2 }}>
          <Box className="brand-mark"><DescriptionRounded /></Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography fontWeight={800} color="primary">CV Simple</Typography>
            <Typography variant="caption" color="text.secondary">{t("tagline")}</Typography>
          </Box>
          <ButtonGroup size="small" aria-label="Language selector">
            <Button
              variant={locale === "es" ? "contained" : "outlined"}
              onClick={() => changeLocale("es")}
              startIcon={locale === "es" ? <LanguageRounded /> : undefined}
            >
              ES
            </Button>
            <Button
              variant={locale === "en" ? "contained" : "outlined"}
              onClick={() => changeLocale("en")}
              startIcon={locale === "en" ? <LanguageRounded /> : undefined}
            >
              EN
            </Button>
          </ButtonGroup>
          <Chip className="privacy-chip" icon={<CloudOffRounded />} label={t("noStorage")} variant="outlined" />
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 3 } }}>
        <Box className="intro">
          <Box>
            <Typography variant="h4" component="h1">{t("heroTitle")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {t("heroDescription")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              color={spaceStatus === "high" ? "warning" : "success"}
              variant="outlined"
              icon={<CheckCircleRounded />}
              label={t("pageUsage", { status: localizedStatus })}
            />
            <Tooltip title={t("restoreExample")}>
              <IconButton onClick={() => reset(initialCv)} aria-label={t("restoreExample")}><RestartAltRounded /></IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {notice && <Alert severity={noticeSuccess ? "success" : "info"} sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}

        <Box className="workspace">
          <Box className="editor-column">
            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("personalInfo")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label={t("name")}
                      inputProps={{ maxLength: 50 }}
                      helperText={<Counter value={data.name} max={50} />}
                      {...register("name")}
                    />
                    <TextField
                      label={t("professionalTitle")}
                      inputProps={{ maxLength: 60 }}
                      helperText={<Counter value={data.headline} max={60} />}
                      {...register("headline")}
                    />
                  </Stack>
                  <Box className="photo-control">
                    {data.photo ? <img src={data.photo} alt={t("photoPreview")} /> : <UploadRounded color="primary" />}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography fontWeight={700}>{t("optionalPhoto")}</Typography>
                      <Typography variant="caption" color="text.secondary">{t("photoHelp")}</Typography>
                    </Box>
                    <Button component="label" variant="outlined" startIcon={<UploadRounded />}>
                      {t("choose")}
                      <input hidden type="file" accept="image/png,image/jpeg" onChange={(event) => onPhoto(event.target.files?.[0])} />
                    </Button>
                    {data.photo && (
                      <IconButton aria-label={t("removePhoto")} onClick={() => setValue("photo", undefined)}>
                        <DeleteOutlineRounded />
                      </IconButton>
                    )}
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ColorLensRounded color="primary" fontSize="small" />
                  <Typography fontWeight={750}>{t("templateColors")}</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {t("colorsHelp")}
                </Typography>
                <Box className="palette-list">
                  {colorPresets.map((preset) => {
                    const paletteName = t(preset.nameKey);
                    const selected =
                      data.primaryColor === preset.primary && data.accentColor === preset.accent;
                    return (
                      <button
                        className={`palette-option${selected ? " selected" : ""}`}
                        type="button"
                        key={preset.nameKey}
                        aria-label={t("usePalette", { name: paletteName })}
                        aria-pressed={selected}
                        onClick={() => {
                          setValue("primaryColor", preset.primary, { shouldDirty: true });
                          setValue("accentColor", preset.accent, { shouldDirty: true });
                        }}
                      >
                        <span style={{ backgroundColor: preset.primary }} />
                        <span style={{ backgroundColor: preset.accent }} />
                        <small>{paletteName}</small>
                      </button>
                    );
                  })}
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
                  <TextField
                    label={t("primaryColor")}
                    type="color"
                    inputProps={{ "aria-label": t("primaryColor") }}
                    {...register("primaryColor")}
                  />
                  <TextField
                    label={t("accentColor")}
                    type="color"
                    inputProps={{ "aria-label": t("accentColor") }}
                    {...register("accentColor")}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("contact")} <Typography component="span" variant="caption" color="text.secondary">({t("allOptional")})</Typography></Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box className="form-grid">
                  <TextField label={t("phone")} inputProps={{ maxLength: 25 }} {...register("phone")} />
                  <TextField label={t("email")} type="email" inputProps={{ maxLength: 100 }} {...register("email")} />
                  <TextField label={t("portfolio")} inputProps={{ maxLength: 150 }} {...register("portfolio")} />
                  <TextField label={t("location")} inputProps={{ maxLength: 80 }} {...register("location")} />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("summaryAndSkills")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    label={t("aboutYou")}
                    multiline
                    minRows={4}
                    inputProps={{ maxLength: 600 }}
                    helperText={<Counter value={data.summary} max={600} />}
                    {...register("summary")}
                  />
                  <Box>
                    <Typography fontWeight={700} mb={1}>{t("skills")} ({skills.fields.length}/12)</Typography>
                    <Stack spacing={1}>
                      {skills.fields.map((field, index) => (
                        <Stack direction="row" spacing={1} alignItems="flex-start" key={field.id}>
                          <TextField
                            label={t("skillNumber", { number: index + 1 })}
                            placeholder={t("skillsPlaceholder")}
                            inputProps={{ maxLength: 50 }}
                            helperText={<Counter value={data.skills[index]?.name} max={50} />}
                            {...register(`skills.${index}.name`)}
                          />
                          <IconButton
                            aria-label={t("removeSkill", { number: index + 1 })}
                            onClick={() => skills.remove(index)}
                            sx={{ width: 40, height: 40, flex: "0 0 40px", mt: 0.5 }}
                          >
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        startIcon={<AddRounded />}
                        disabled={skills.fields.length >= 12}
                        onClick={() => skills.append({ name: "" })}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        {t("addSkill")}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("languages")} ({languages.fields.length}/5)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {languages.fields.map((field, index) => (
                    <Stack direction="row" spacing={1} key={field.id}>
                      <TextField label={t("language")} inputProps={{ maxLength: 30 }} {...register(`languages.${index}.name`)} />
                      <TextField label={t("level")} inputProps={{ maxLength: 40 }} {...register(`languages.${index}.level`)} />
                      <IconButton aria-label={t("removeLanguage", { number: index + 1 })} onClick={() => languages.remove(index)}>
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    startIcon={<AddRounded />}
                    disabled={languages.fields.length >= 5}
                    onClick={() => languages.append({ name: "", level: "" })}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {t("addLanguage")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("experience")} ({experiences.fields.length}/4)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {experiences.fields.map((field, index) => (
                    <Box className="experience-form" key={field.id}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Typography fontWeight={750}>{t("experienceNumber", { number: index + 1 })}</Typography>
                        <IconButton aria-label={t("removeExperience", { number: index + 1 })} onClick={() => experiences.remove(index)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Stack>
                      <Box className="form-grid">
                        <TextField label={t("company")} inputProps={{ maxLength: 60 }} {...register(`experiences.${index}.company`)} />
                        <TextField label={t("role")} inputProps={{ maxLength: 60 }} {...register(`experiences.${index}.role`)} />
                        <TextField label={t("workLocation")} inputProps={{ maxLength: 70 }} {...register(`experiences.${index}.location`)} />
                        <Stack direction="row" spacing={1}>
                          <TextField label={t("from")} inputProps={{ maxLength: 20 }} {...register(`experiences.${index}.start`)} />
                          <TextField label={t("to")} inputProps={{ maxLength: 20 }} {...register(`experiences.${index}.end`)} />
                        </Stack>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1.5} mb={1}>
                        {t("achievements")}
                      </Typography>
                      {[0, 1, 2, 3].map((bulletIndex) => (
                        <Controller
                          key={bulletIndex}
                          control={control}
                          name={`experiences.${index}.bullets.${bulletIndex}`}
                          defaultValue=""
                          render={({ field: bulletField }) => (
                            <TextField
                              {...bulletField}
                              value={bulletField.value ?? ""}
                              label={t("bullet", { number: bulletIndex + 1 })}
                              inputProps={{ maxLength: 160 }}
                              sx={{ mb: 1 }}
                            />
                          )}
                        />
                      ))}
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddRounded />}
                    disabled={experiences.fields.length >= 4}
                    onClick={() =>
                      experiences.append({ company: "", role: "", location: "", start: "", end: "", bullets: [""] })
                    }
                  >
                    {t("addExperience")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Alert icon={<LockOutlined />} severity="info" sx={{ mt: 2 }}>
              {t("privacyNotice")}
            </Alert>
          </Box>

          <Box className="preview-column">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography variant="h6">{t("preview")}</Typography>
                <Typography variant="caption" color="text.secondary">{t("a4OnePage")}</Typography>
              </Box>
              <Chip size="small" label="A4" />
            </Stack>

            <Box className="paper-wrap">
              <article
                className="cv-paper"
                style={{
                  "--cv-primary": data.primaryColor,
                  "--cv-accent": data.accentColor,
                } as CSSProperties}
              >
                <aside className="cv-sidebar">
                  <div className="top-accent" />
                  <h2>{data.name || "Tu nombre"}</h2>
                  {data.headline && <p className="cv-headline">{data.headline}</p>}
                  {data.photo && <img className="cv-photo" src={data.photo} alt="" />}
                  {hasContact && (
                    <section>
                      <h3>{t("cvContact")}</h3>
                      {data.location && <p><b>{t("location")}:</b><br />{data.location}</p>}
                      {data.phone && <p><b>{t("phone")}:</b><br />{data.phone}</p>}
                      {data.email && <p><b>{t("email")}:</b><br />{data.email}</p>}
                      {data.portfolio && <p><b>{t("portfolio")}:</b><br />{data.portfolio}</p>}
                    </section>
                  )}
                  {data.languages.some((language) => language.name) && (
                    <section>
                      <h3>{t("cvLanguages")}</h3>
                      {data.languages.filter((language) => language.name).map((language, index) => (
                        <p className="compact" key={`${language.name}-${index}`}><b>{language.name}:</b> {language.level}</p>
                      ))}
                    </section>
                  )}
                </aside>
                <main className="cv-main">
                  {data.summary && <section><h3>{t("cvSummary")}</h3><p>{data.summary}</p></section>}
                  {data.experiences.some((experience) => experience.company || experience.role) && (
                    <section>
                      <h3>{t("cvExperience")}</h3>
                      {data.experiences.filter((experience) => experience.company || experience.role).map((experience, index) => (
                        <div className="cv-experience" key={`${experience.company}-${index}`}>
                          <h4>{experience.company}{experience.company && experience.role ? " — " : ""}<i>{experience.role}</i></h4>
                          <p className="cv-meta">
                            {[experience.location, [experience.start, experience.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}
                          </p>
                          <ul>{experience.bullets.filter(Boolean).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>
                        </div>
                      ))}
                    </section>
                  )}
                  {skillItems.length > 0 && (
                    <section>
                      <h3>{t("cvSkills")}</h3>
                      <ul className="cv-skills">
                        {skillItems.map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}
                      </ul>
                    </section>
                  )}
                </main>
                <div className="bottom-accent" />
              </article>
            </Box>

            <Box className="export-panel">
              <Typography fontWeight={780}>{t("downloadTitle")}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                {t("downloadPrivacy")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PictureAsPdfRounded />}
                  disabled={!!exporting}
                  onClick={() => runExport("pdf")}
                >
                  {exporting === "pdf" ? t("generating") : t("downloadPdf")}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<InsertDriveFileRounded />}
                  disabled={!!exporting}
                  onClick={() => runExport("docx")}
                >
                  {exporting === "docx" ? t("generating") : t("downloadDocx")}
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box className="reconvert-box">
                <Box>
                  <Typography fontWeight={750} variant="body2">{t("editedDocx")}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("editedDocxHelp")}
                  </Typography>
                </Box>
                <Button
                  component="a"
                  href="https://www.ilovepdf.com/word_to_pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewRounded />}
                  variant="text"
                  size="small"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("convertDocx")}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                {t("externalNotice")}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
