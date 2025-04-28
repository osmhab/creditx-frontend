import React from "react";
import { Box, Typography } from "@mui/material";

const steps = [
  "Personnes",
  "Situation financière",
  "Financement",
  "Immeuble",
  "Documents",
  "Acceptation",
];

const CustomStepper = ({ activeStep }) => {
  return (
    <Box
      display="flex"
      borderBottom="1px solid #e0e0e0"
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
              borderRight: index < steps.length - 1 ? "1px solid #ddd" : "none",
              backgroundColor: "#fff",
            }}
          >
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              border="2px solid"
              borderColor={isActive || isCompleted ? "blue" : "#ccc"}
              bgcolor={isActive ? "blue" : "#fff"}
              color={isActive ? "#fff" : isCompleted ? "blue" : "#999"}
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

      {/* Barre de progression orange */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        height="4px"
        bgcolor="orange"
        width={`${((activeStep - 1) / (steps.length - 1)) * 100}%`}
        transition="width 0.3s"
      />
    </Box>
  );
};

export default CustomStepper;
