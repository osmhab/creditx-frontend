const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// ✅ Fonction déclenchée à la création d’un user
exports.sendCustomVerificationEmail = functions.auth.user().onCreate(async (user) => {
  const smtpUser = functions.config().smtp.user;
  const smtpPass = functions.config().smtp.pass;

  const transporter = nodemailer.createTransport({
    host: "mail.infomaniak.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const email = user.email;
  const displayName = user.displayName || "Bienvenue sur CreditX";

  try {
    // 🔗 Lien de vérification Firebase
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    // ✅ Email personnalisé
    const mailOptions = {
      from: `"CreditX" <noreply@creditx.ch>`,
      to: email,
      subject: "Confirmez votre adresse e-mail",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#001BFF;">Bienvenue sur CreditX</h2>
          <p>Bonjour ${displayName},</p>
          <p>Merci de vous être inscrit. Pour activer votre compte, veuillez confirmer votre adresse e-mail :</p>
          <p style="text-align:center;margin:30px 0;">
            <a href="${verificationLink}" style="background-color:#001BFF;color:white;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:bold;">Confirmer mon adresse</a>
          </p>
          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p style="word-break:break-all;">${verificationLink}</p>
          <hr/>
          <p style="font-size:12px;color:gray;">
            Si vous n'avez pas demandé cette inscription, ignorez cet e-mail.<br/>
            Vérifiez également votre dossier <strong>spam</strong> si vous ne trouvez pas cet e-mail.
          </p>
          <p style="font-size:13px;color:#999;">– L’équipe CreditX</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email de vérification envoyé à :", email);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'e-mail :", error);
  }
});

exports.resendVerificationEmail = functions.https.onCall(async (data, context) => {
  const email = data.email;

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email manquant.");
  }

  const smtpUser = functions.config().smtp.user;
  const smtpPass = functions.config().smtp.pass;

  const transporter = nodemailer.createTransport({
    host: "mail.infomaniak.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    const mailOptions = {
      from: `"CreditX" <noreply@creditx.ch>`,
      to: email,
      subject: "Confirmez votre adresse e-mail",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#001BFF;">Bienvenue sur CreditX</h2>
          <p>Bonjour,</p>
          <p>Voici un nouveau lien pour confirmer votre adresse e-mail :</p>
          <p style="text-align:center;margin:30px 0;">
            <a href="${verificationLink}" style="background-color:#001BFF;color:white;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:bold;">Confirmer mon adresse</a>
          </p>
          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p style="word-break:break-all;">${verificationLink}</p>
          <hr/>
          <p style="font-size:12px;color:gray;">
            Vérifiez aussi votre dossier <strong>spam</strong> si vous ne trouvez pas cet e-mail.
          </p>
          <p style="font-size:13px;color:#999;">– L’équipe CreditX</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur envoi e-mail de vérification :", error);
    throw new functions.https.HttpsError("internal", "Erreur lors de l’envoi de l’e-mail.");
  }
});


//Envoi message depuis formulaire de contact
exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  const fromEmail = (data.fromEmail || data.email || "").trim();
  const message = (data.message || "").toString();

  if (!fromEmail || !message) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "L'adresse e-mail et le message sont requis."
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fromEmail)) {
    throw new functions.https.HttpsError("invalid-argument", "Adresse e-mail invalide.");
  }

  if (message.trim().length < 10) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Le message doit contenir au moins 10 caractères."
    );
  }

  const smtpUser = functions.config().smtp.user;
  const smtpPass = functions.config().smtp.pass;

  const transporter = nodemailer.createTransport({
    host: "mail.infomaniak.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `"CreditX – Formulaire de contact" <noreply@creditx.ch>`,
    to: "info@creditx.ch",
    replyTo: fromEmail,
    subject: "📩 Nouveau message via le formulaire de contact",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2 style="color:#001BFF;">Nouveau message reçu</h2>
        <p><strong>De :</strong> ${fromEmail}</p>
        <p><strong>Message :</strong></p>
        <p style="white-space:pre-wrap;">${message}</p>
        <hr/>
        <p style="font-size:12px;color:gray;">Envoyé depuis le formulaire de contact du site CreditX</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Message du formulaire envoyé depuis ${fromEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du message :", error);
    throw new functions.https.HttpsError(
      "internal",
      "Impossible d'envoyer le message pour le moment."
    );
  }
});

