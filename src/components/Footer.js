// src/components/Footer.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import logoBlack from '../assets/logo-creditx-black.svg'; // ✅ importe ton logo noir

const Footer = () => {
  const navigate = useNavigate();

  const handleProtectedRedirect = () => {
    const user = getAuth().currentUser;
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login-client');
    }
  };

  return (
    <footer className="bg-gray-100 text-gray-600 text-sm mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ✅ Colonne 1 : Logo + pitch */}
        <div>
          <Link to="/" className="inline-block mb-3">
            <img src={logoBlack} alt="CreditX" className="h-8 w-auto" />
          </Link>
          <p>
            Plateforme suisse 100% digitale pour vos crédits hypothécaires.
          </p>
        </div>

        {/* Colonne 2 : Navigation */}
        <div>
          <h4 className="font-semibold text-black mb-2">Navigation</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:underline">Accueil</Link></li>
            <li><button onClick={handleProtectedRedirect} className="hover:underline">Dashboard</button></li>
            <li><Link to="/login-client" className="hover:underline">Connexion</Link></li>
            <li><Link to="/mentions-legales" className="hover:underline">Mentions légales</Link></li>
          </ul>
        </div>

        {/* Colonne 3 : Contact */}
        <div>
          <h4 className="font-semibold text-black mb-2">Contact</h4>
          <p>Email : <a href="mailto:contact@creditx.ch" className="hover:underline">contact@creditx.ch</a></p>
          <p>Tél : +41 79 123 45 67</p>
          <p>Valais, Suisse</p>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} CreditX. Tous droits réservés.
      </div>
    </footer>
  );
};

export default Footer;
