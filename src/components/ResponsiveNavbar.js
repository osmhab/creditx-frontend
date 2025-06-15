// src/components/ResponsiveNavbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

const ResponsiveNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="w-full px-8 md:px-24 pt-0 relative z-50">
      <div className="hidden xl:grid grid-cols-[auto_1fr_auto] items-center h-[90px] w-full">
        {/* Logo */}
        <Link to="/" className="text-4xl font-extrabold tracking-tight text-white">
          CreditX
        </Link>

        {/* Menu Center */}
        <nav className="ml-8 flex gap-8 text-white text-lg font-semibold justify-left">
          <a href="#fonctionnement" className="hover:underline transition">Comment ça marche ?</a>
          <a href="#avantages" className="hover:underline transition">Avantages</a>
          <a href="#banques" className="hover:underline transition">Pour les banques</a>
        </nav>

        {/* Actions Right */}
        <div className="flex items-center gap-4 justify-end">
          <Link
            to="/login"
            className="text-white text-lg font-semibold px-6 py-2 hover:underline transition"
          >
            Se connecter
          </Link>
          <Link
            to="/inscription-banque"
            className="bg-white text-black px-10 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition"
          >
            S’inscrire
          </Link>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="xl:hidden flex justify-between items-center py-4">
        <Link to="/" className="text-4xl font-extrabold tracking-tight text-white">
          CreditX
        </Link>
        <button onClick={toggleMenu} className="text-white text-3xl">
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="xl:hidden flex flex-col gap-4 bg-white text-black shadow-md p-6 rounded-md">
          <a href="#fonctionnement" className="text-lg font-semibold px-4 py-2 hover:underline transition">Comment ça marche ?</a>
          <a href="#avantages" className="text-lg font-semibold px-4 py-2 hover:underline transition">Avantages</a>
          <a href="#banques" className="text-lg font-semibold px-4 py-2 hover:underline transition">Pour les banques</a>
          <Link to="/login" className="text-lg font-semibold px-4 py-2 hover:underline transition">Se connecter</Link>
          <Link
            to="/inscription-banque"
            className="bg-black text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-900 transition w-fit"
          >
            S’inscrire
          </Link>
        </div>
      )}
    </header>
  );
};

export default ResponsiveNavbar;
