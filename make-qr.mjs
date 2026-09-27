import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.PUBLIC_REVIEW_URL;
if (!url || url.includes("YOUR-DOMAIN")) {
  console.error("Set PUBLIC_REVIEW_URL in .env before creating the final QR.");
  process.exit(1);
}

const outDir = path.resolve("qr");
fs.mkdirSync(outDir, { recursive: true });

const out = path.join(outDir, "al-tandoor-review-qr.png");
await QRCode.toFile(out, url, {
  width: 1400,
  margin: 2,
  errorCorrectionLevel: "H"
});

console.log(`QR created: ${out}`);
console.log(`Encoded URL: ${url}`);
