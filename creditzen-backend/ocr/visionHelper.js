import { fromBuffer } from "pdf2pic";
import tmp from "tmp";
import vision from "@google-cloud/vision";
import fs from "fs/promises";

const client = new vision.ImageAnnotatorClient({
  keyFilename: "./secrets/ocr-access.json",
});

export async function extraireTexte(buffer, mimetype = "image/png") {
  console.log("📎 Type de fichier reçu pour OCR :", mimetype.includes("pdf") ? "PDF" : mimetype);

  // Si c’est un PDF : convertir en images avec pdf2pic
  if (mimetype.includes("pdf")) {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const convert = fromBuffer(buffer, {
      density: 200,
      saveFilename: "page",
      savePath: tmpDir.name,
      format: "jpg",
      width: 1200,
      height: 1600,
    });

    console.log("🖼️ Conversion PDF → image en cours...");
    const pages = await convert.bulk(-1); // <- Par défaut, ça retourne un tableau avec les infos de chaque page
    console.log(`📄 ${pages.length} page(s) convertie(s) depuis le PDF`);

    let texteComplet = "";

    for (const page of pages) {
      const imageBuffer = await fs.readFile(page.path);
      const [result] = await client.documentTextDetection({ image: { content: imageBuffer } });

      const detected = result.textAnnotations?.[0]?.description || "";
      texteComplet += detected + "\n\n";
    }

    tmpDir.removeCallback(); // nettoyage du dossier temporaire
    return texteComplet;
  }

  // Sinon, c’est une image classique
  const [result] = await client.documentTextDetection({ image: { content: buffer } });

  console.log("🔍 Résultat brut Google Vision:", JSON.stringify(result, null, 2));

  const detections = result.textAnnotations;
  if (!detections || detections.length === 0) {
    console.warn("⚠️ Aucun texte détecté dans l'image.");
  }

  return detections?.[0]?.description || "";
}
