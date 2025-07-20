// src/pages/HomePage.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import heroBg from '../assets/hero-bg.webp';

import ResponsiveNavbar from '../components/ResponsiveNavbar';
import SectionAvantages from '../components/SectionAvantages';
import SectionCTA from '../components/SectionCTA';
import Footer from '../components/Footer';
import SimulationEtapes from '../components/SimulationEtapes';
import TroisEtapes from '../components/TroisEtapes';

import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { motion } from "framer-motion";

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = getAuth();

  const handleHeroCTA = () => {
    const user = auth.currentUser;
    navigate(user ? '/dashboard' : '/login-client');
  };

  const handleScroll = () => {
    const section = document.getElementById('trois-etapes');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollSimulation = () => {
    const section = document.getElementById('simulation-target');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="bg-white text-black font-sans min-h-screen flex flex-col">
      <Helmet>
        <title>Hypothèque intelligente | CreditX</title>
        <meta
          name="description"
          content="Recevez des offres de plus de 50 banques en moins de 48h grâce à notre plateforme d'hypothèques intelligentes."
        />
      </Helmet>

      {/* Hero section */}
      <div
        className="relative h-[90vh] md:h-screen flex flex-col px-8 md:px-24 pt-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <ResponsiveNavbar />

        <div className="flex flex-col justify-center flex-1 px-8 md:px-24 max-w-3xl">
          <h1 className="text-[35px] text-white md:text-[110px] font-extrabold uppercase leading-[1.05] mb-6 tracking-tight">
            L’HYPOTHÈQUE<br />INTELLIGENTE.
          </h1>

          <p className="text-lg md:text-2xl text-white mb-10 max-w-xl">
            Recevez des offres de plus de 50 banques en moins de 48h.
          </p>

          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              onClick={handleHeroCTA}
              className="bg-white text-black px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition w-fit"
            >
              Commencez maintenant
            </button>
            <button
              onClick={handleScrollSimulation}
              className="bg-transparent text-white border border-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-black transition w-fit"
            >
              Calculer votre hypothèque
            </button>
          </div>
        </div>

        <button
          onClick={handleScroll}
          aria-label="Scroll"
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <motion.div
          id="trois-etapes"
          variants={variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <TroisEtapes />
        </motion.div>

        <motion.div
          id="scroll-target"
          variants={variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
        >
          <SectionAvantages />
        </motion.div>

        <motion.div
          id="simulation-target"
          variants={variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={2}
        >
          <SimulationEtapes />
        </motion.div>
      </main>

      <SectionCTA />
      <Footer />
    </div>
  );
};

export default HomePage;
