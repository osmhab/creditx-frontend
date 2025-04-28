import React from "react";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import BulleMessageCreditX from "./BulleMessageCreditX";

const Versement3ePilierChat = ({ typeVersement3ePilier, setTypeVersement3ePilier }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <BulleMessageCreditX>
        <span className="typewriter">
          Souhaitez-vous utiliser votre 3e pilier bancaire, assurance ou les deux ?
        </span>
      </BulleMessageCreditX>

      <Box sx={{ mt: 2 }}>
        <ToggleButtonGroup
          value={typeVersement3ePilier}
          exclusive
          onChange={(e, value) => {
            if (value !== null) setTypeVersement3ePilier(value);
          }}
          fullWidth
        >
          <ToggleButton value="bancaire">3a bancaire</ToggleButton>
          <ToggleButton value="assurance">3a assurance</ToggleButton>
          <ToggleButton value="lesDeux">Les deux</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default Versement3ePilierChat;
