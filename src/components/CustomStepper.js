import React from "react";
import { Box, Typography } from "@mui/material";

const steps = [
  "Personnes",
  "Situation financière",
  "Produit",
  "Financement",
  "Documents",
  "Finalisation",
];

const CustomStepper = ({ activeStep }) => {
  return (
    <Box
      display="flex"
      borderBottom= "1px solid #f5f5f5"// plus subtil
      position="relative"
      mb={4}
    >
      {steps.map((label, index) => {
        const isActive = index + 1 === activeStep;
        const isCompleted = index + 1 < activeStep;

        return (
          <Box
            key={index}
            flex={1}
            textAlign="center"
            py={2}
            sx={{
              backgroundColor: "#fff",
            }}
          >
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              border="2px solid"
              borderColor={isActive || isCompleted ? "primary.main" : "#ccc"}
              bgcolor={isActive ? "primary.main" : "#fff"}
              color={isActive ? "#fff" : isCompleted ? "primary.main" : "#999"}
              borderRadius="50%"
              width={28}
              height={28}
              fontWeight="bold"
              mx="auto"
              mb={1}
              fontSize={14}
            >
              {index + 1}
            </Box>
            <Typography
              fontSize={14}
              fontWeight={isActive ? "bold" : "normal"}
              color={isActive ? "black" : isCompleted ? "black" : "#bbb"}
            >
              {label}
            </Typography>
          </Box>
        );
      })}

 
      <Box
  position="absolute"
  bottom={0}
  left={0}
  height="4px"
  bgcolor="secondary.main"
  width={`${((activeStep - 1) / (steps.length - 1)) * 100}%`}
  sx={{ transition: "width 0.3s" }}
/>

    </Box>
  );
};

export default CustomStepper;
