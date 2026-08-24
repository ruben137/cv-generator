import * as React from "react";

import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField } from "@mui/material";
import { useTranslations } from "next-intl";

import PreviewContent from "./PreviewContent";
import type { CvData } from "../types";

type ExportFormat = "pdf" | "docx";

interface PreviewCvModalProps {
  children: React.ReactNode;
  cv: CvData;
  title: string;
  disabledPreview?: boolean;
  exporting?: ExportFormat | null;
  onOpenCv: () => void;
  onDownload: (format: ExportFormat, previewCv: CvData) => void;
  onReviewQuality: () => void;
  onAnalyzeJob: () => void;
}

export default function PreviewCvModal({ children, cv, title, disabledPreview = false, exporting = null, onOpenCv, onDownload, onReviewQuality, onAnalyzeJob }: PreviewCvModalProps) {
  const t = useTranslations("App");
  const [open, setOpen] = React.useState(false);
  const [temporaryTemplate, setTemporaryTemplate] = React.useState<CvData["template"]>(cv.template);
  const previewCv = React.useMemo(() => ({ ...cv, template: temporaryTemplate }), [cv, temporaryTemplate]);
  const templateOptions: CvData["template"][] = ["classic", "modern", "minimal", "right", "compact", "contrast", "editorial", "harvard"];

  const openPreview = () => {
    setTemporaryTemplate(cv.template);
    setOpen(true);
  };

  if (disabledPreview) return children;

  return (
    <>
      <button type="button" className="cv-preview-trigger" aria-label={t("previewCvNamed", { title })} onClick={openPreview}>
        {children}
        <span className="cv-preview-trigger-overlay" aria-hidden="true"><VisibilityOutlinedIcon />{t("preview")}</span>
      </button>

      <Dialog className="cv-preview-dialog" open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          <span>{t("previewCvNamed", { title })}</span>
          <IconButton aria-label={t("closePreview")} onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="cv-preview-template-control">
            <div><strong>{t("temporaryTemplate")}</strong><span>{t("temporaryTemplateHelp")}</span></div>
            <TextField select size="small" label={t("chooseTemplate")} value={temporaryTemplate} onChange={(event) => setTemporaryTemplate(event.target.value as CvData["template"])}>
              {templateOptions.map((template) => <MenuItem key={template} value={template}>{t(`template${template[0].toUpperCase()}${template.slice(1)}`)}</MenuItem>)}
            </TextField>
          </div>
          <PreviewContent previewData={previewCv} />
        </DialogContent>
        <DialogActions>
          <div className="cv-preview-tool-actions">
            <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={onOpenCv}>{t("openCv")}</Button>
            <Button className="preview-quality-action" variant="outlined" startIcon={<FactCheckOutlinedIcon />} onClick={onReviewQuality}>{t("openResumeReview")}</Button>
            <Button className="preview-match-action" variant="outlined" startIcon={<ManageSearchRoundedIcon />} onClick={onAnalyzeJob}>{t("openJobMatch")}</Button>
          </div>
          <div className="cv-preview-download-actions">
            <Button variant="outlined" startIcon={exporting === "docx" ? <CircularProgress size={16} /> : <ArticleOutlinedIcon />} disabled={Boolean(exporting)} onClick={() => onDownload("docx", previewCv)}>
              {exporting === "docx" ? t("generating") : t("downloadDocx")}
            </Button>
            <Button variant="contained" startIcon={exporting === "pdf" ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfRoundedIcon />} disabled={Boolean(exporting)} onClick={() => onDownload("pdf", previewCv)}>
              {exporting === "pdf" ? t("generating") : t("downloadPdf")}
            </Button>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}
