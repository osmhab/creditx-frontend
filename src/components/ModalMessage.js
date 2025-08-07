// src/components/ModalMessage.js
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Slide, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} timeout={300} />
));

const ModalMessage = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  showCancel = true,
  onlyConfirm = false,
  showCloseIcon = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          padding: 3,
          textAlign: 'center',
        },
      }}
    >
      {showCloseIcon && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      <DialogTitle sx={{ fontWeight: 600, fontSize: 22 }}>{title}</DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1.5,
          mt: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={onConfirm}
          fullWidth
          sx={{
            borderRadius: '999px',
            fontWeight: 600,
            backgroundColor: '#0047FF',
            textTransform: 'none',
            fontSize: 16,
            boxShadow: 2,
            ':hover': { backgroundColor: '#0033cc' },
          }}
        >
          {confirmText}
        </Button>

        {showCancel && !onlyConfirm && (
          <Button
            variant="contained"
            onClick={onClose}
            fullWidth
            sx={{
              borderRadius: '999px',
              fontWeight: 600,
              backgroundColor: '#e0e7ff',
              color: '#111827',
              textTransform: 'none',
              fontSize: 16,
              boxShadow: 0,
              ':hover': { backgroundColor: '#c7d2fe' },
            }}
          >
            {cancelText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalMessage;

