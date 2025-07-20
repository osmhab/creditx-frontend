// src/pages/MentionsLegales.js
import React from 'react';

const MentionsLegales = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Mentions légales</h1>

      <h2 className="text-xl font-semibold mt-8 mb-2">Éditeur du site</h2>
      <p>
        Ce site est édité par CreditX – CreditX Sàrl<br />
        Avenue de la Gare 54, 1964 Conthey, Suisse<br />
        Email : info@creditx.ch<br />
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Hébergement</h2>
      <p>
        Le site est hébergé par Firebase (Google).<br />
        Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Droits d’auteur</h2>
      <p>
        © {new Date().getFullYear()} CreditX. Tous droits réservés.<br />
        Le contenu de ce site (textes, images, code, etc.) est protégé par le droit d’auteur.
        Toute reproduction ou utilisation sans autorisation est interdite.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Responsabilité</h2>
      <p>
        Malgré tout le soin apporté à la vérification des informations publiées, aucune garantie
        n’est donnée quant à leur exactitude ou leur exhaustivité. CreditX décline toute
        responsabilité pour les dommages éventuels liés à l’utilisation du site.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Protection des données</h2>
      <p>
        Vos données sont traitées de manière confidentielle. Aucune donnée personnelle n’est
        transmise à des tiers sans votre consentement. Pour plus d’informations, veuillez consulter
        notre politique de confidentialité.
      </p>
    </div>
  );
};

export default MentionsLegales;
