import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Typography } from "@mui/material";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  warning: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ open, title, warning, message, cancelLabel, confirmLabel, closeLabel, loading = false, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <Dialog className="cv-delete-dialog" open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box className="cv-delete-dialog-heading">
          <Box className="cv-delete-dialog-icon"><DeleteOutlineRoundedIcon /></Box>
          <Box>
            <Typography component="span">{title}</Typography>
            <Typography component="small">{warning}</Typography>
          </Box>
        </Box>
        <IconButton aria-label={closeLabel} disabled={loading} onClick={onClose}><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions>
        <Button variant="outlined" disabled={loading} onClick={onClose}>{cancelLabel}</Button>
        <Button variant="contained" color="error" disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon />} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
