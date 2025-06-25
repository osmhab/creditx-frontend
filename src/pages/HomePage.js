// src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import heroBg from '../assets/hero-bg.jpg';
import ResponsiveNavbar from '../components/ResponsiveNavbar';
import SectionFonctionnementPremium from '../components/SectionFonctionnementPremium';
import SectionAvantages from '../components/SectionAvantages';


import EtapeCard from "../components/EtapeCard";
import { HiOutlineDocumentText, HiOutlineChartSquareBar, HiOutlinePencilAlt } from 'react-icons/hi';
import { RiBankLine } from 'react-icons/ri';
import { motion } from "framer-motion";


const HomePage = () => {
  const { t } = useTranslation();



const variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
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
      {/* Hero section avec navbar */}
      <div
        className="h-screen flex flex-col px-8 md:px-24 pt-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <ResponsiveNavbar />

        {/* Bloc Hero contenu (aligné en haut) */}
        <div className="flex flex-col justify-center flex-1 px-8 md:px-24 max-w-3xl">


          <h1 className="text-[35px] text-white md:text-[110px] font-extrabold uppercase leading-[1.05] mb-6 tracking-tight">
            L’HYPOTHÈQUE<br />INTELLIGENTE.
          </h1>

          <p className="text-lg md:text-2xl text-white mb-10 max-w-xl">
            Recevez des offres de plus de 50 banques en moins de 48h.
          </p>

          <Link
            to="/formulaire"
            className="bg-white text-black px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition w-fit"
          >
            Commencez maintenant
          </Link>
        </div>
      </div>

    <SectionFonctionnementPremium />

    <SectionAvantages />


      {/* Section CTA */}
      <section className="bg-blue-50 h-screen flex items-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-gray-700 text-lg mb-8">{t('cta.subtitle')}</p>
          <Link
            to="/formulaire"
            className="inline-block px-6 py-3 text-white bg-blue-600 rounded-full text-sm font-medium hover:bg-blue-700 transition"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>



      {/* Footer */}
      <footer className="p-6 border-t text-sm text-center text-gray-500">
        © {new Date().getFullYear()} CreditX. Tous droits réservés.
      </footer>
    </div>
  );
};

export default HomePage;
