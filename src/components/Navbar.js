import React from "react";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";

const Navbar = ({ role }) => {
  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ height: "64px", zIndex: 1200 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        
        {/* Logo + Nom */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src="/logo.png" alt="Logo CreditX" style={{ height: 44 }} />
          
        </Box>

        {/* Liens */}
        <Box>
          <Button component={Link} to="/" color="inherit">Simulation</Button>
          <Button component={Link} to="/estimation" color="inherit">Estimation</Button>
          <Button component={Link} to="/test-firebase" color="inherit">Test Firebase</Button>
          <Button component={Link} to="/login" color="inherit">Connexion</Button>
          <Button component={Link} to="/formulaire?new=1" color="inherit">Nouvelle demande</Button>
          <Button component={Link} to="/demandes" color="inherit">Demandes en cours</Button>

          <Button component={Link} to="/formulaire" color="inherit">Dossier</Button>
          <Button component={Link} to="/inscription-banque" color="inherit">Banque +</Button>
          {role === "banque" && (
            <Button component={Link} to="/banque" color="inherit">Dashboard</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
