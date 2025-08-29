// src/components/ModalMessage.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Slide,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';

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
  confirmDisabled = false, 
  showCancel = true,
  onlyConfirm = false,
  showCloseIcon = false,
  showIcon = true,
  // type d’icône ("knowledge" | "info" | "warning" | "success" | null)
  iconType = 'info',
  // styles facultatifs pour l’icône (sx MUI)
  iconSx,

  // 🔥 NOUVELLES PROPS D’OVERRIDE
  fullWidth = true,
  maxWidth = 'sm',               // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  paperSx = {},                  // styles injectés au Paper du Dialog
  contentSx = {},               // styles injectés au DialogContent
}) => {
  // Choix d’icône selon le contexte
  let IconComp = null;
  let defaultColor = '#001BFF'; // bleu CreditX par défaut

  if (showIcon && iconType) {
    switch (iconType) {
      case 'knowledge':
        IconComp = SchoolOutlinedIcon;
        defaultColor = '#001BFF';
        break;
      case 'rocket':
        IconComp = RocketLaunchOutlinedIcon;
        defaultColor = '#001BFF';
        break;
      case 'info':
        IconComp = InfoOutlinedIcon;
        defaultColor = '#001BFF'; // bleu clair
        break;
      case 'warning':
        IconComp = WarningAmberOutlinedIcon;
        defaultColor = '#F59E0B'; // orange
        break;
      case 'success':
        IconComp = CheckCircleOutlineIcon;
        defaultColor = '#10B981'; // vert
        break;
      default:
        IconComp = null;
    }
  }

  const renderMessage = () => {
    // si message est un élément React, on l’affiche tel quel; sinon on wrap dans Typography
    return React.isValidElement(message) ? (
      message
    ) : (
      <Typography variant="body1" sx={{ mt: 1 }}>
        {message}
      </Typography>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      scroll="paper"
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          padding: 3,
          textAlign: 'center',
          maxHeight: '85vh',
          ...paperSx, // ✅ overrides
        },
      }}
    >
      {showCloseIcon && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      )}

      {IconComp && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
          <IconComp sx={{ fontSize: 44, color: defaultColor, ...iconSx }} />
        </Box>
      )}

      {title && <DialogTitle sx={{ fontWeight: 600, fontSize: 22 }}>{title}</DialogTitle>}

      <DialogContent
        dividers
        sx={{
          pt: 1.5,
          ...contentSx, // ✅ overrides
        }}
      >
        {renderMessage()}
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
