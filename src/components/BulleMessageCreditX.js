import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Fade } from "@mui/material";

const texte = "Souhaitez-vous utiliser votre 3e pilier bancaire, assurance ou les deux ?";

const BulleMessageCreditX = () => {
  const [texteAffiche, setTexteAffiche] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < texte.length) {
      const timeout = setTimeout(() => {
        setTexteAffiche((prev) => prev + texte[index]);
        setIndex((prev) => prev + 1);
      }, 25);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          backgroundColor: "#f1f1f1",
          borderRadius: 2,
          p: 2,
          mt: 2,
          borderLeft: "4px solid #001BFF",
        }}
      >
       <Avatar
  src="/Logo.png"
  alt="Logo CreditX"
  sx={{
    width: 40,
    height: 40,
    bgcolor: "transparent",
    img: {
      objectFit: "contain",
      width: "100%",
      height: "100%",
    },
  }}
/>

        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {texteAffiche}
        </Typography>
      </Box>
    </Fade>
  );
};

export default BulleMessageCreditX;
