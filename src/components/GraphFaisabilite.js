// GraphFaisabilite.js
import React, { useEffect, useState } from "react";
import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Box, Typography } from "@mui/material";

const GraphFaisabilite = ({ charges, revenuAnnuel = 1 }) => {
  const [progress, setProgress] = useState(0);

  const ratio = revenuAnnuel > 0 ? charges / revenuAnnuel : 0;
  const target = Math.round(ratio * 100);

  const color = target > 33 ? "#f44336" : "#4caf50";

  useEffect(() => {
    setProgress(0);
    const duration = 700; // ms
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setProgress(target);
        clearInterval(timer);
      } else {
        setProgress(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [charges, revenuAnnuel, target]);

  const formatCHF = (val) => {
    return val ? Number(val).toLocaleString("fr-CH").replace(/\s/g, "’") : "0";
  };

  return (
    <Box width={150} mx="auto" position="relative">
      {/* Cercle principal */}
      <Box position="relative" zIndex={1}>
        <CircularProgressbar
          value={progress}
          text={`${progress}%`}
          styles={buildStyles({
            textSize: "16px",
            pathColor: color,
            textColor: "#333",
            trailColor: "#e0e0e0",
            strokeLinecap: "round"
          })}
        />
      </Box>

      {/* Marqueur 33 % avec une petite ligne SVG superposée */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#ff9800"
            strokeWidth="2"
            strokeDasharray="1, 282.6"
            strokeDashoffset={282.6 * (1 - 0.33)}
            transform="rotate(-90 50 50)"
          />
        </svg>
      </Box>

      <Typography align="center" mt={2} variant="body2">
        Pourcentage de charge sur revenu annuel
      </Typography>
      <Typography align="center" mt={1} variant="caption" color="text.secondary">
        Max autorisé : 33% du revenu ({formatCHF(revenuAnnuel * 0.33)} CHF)
      </Typography>
      <Typography
        align="center"
        mt={1}
        variant="subtitle2"
        color={target > 33 ? "error" : "success.main"}
      >
        {target > 33 ? "❌ Taux trop élevé" : "✔ Taux admissible"}
      </Typography>
    </Box>
  );
};

export default GraphFaisabilite;