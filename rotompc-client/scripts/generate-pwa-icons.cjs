// filepath: rotompc-client/scripts/generate-pwa-icons.cjs

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/* =========================================================
   PATHS
========================================================= */

const root = path.resolve(__dirname, "..");

/*
 * IMPORTANT:
 *
 * Browser favicon:
 * public/rotompc-icon.svg
 *
 * Installed application icon source:
 * public/Rotompc-app-icon.png
 *
 * Do not use the SVG as the PWA/home-screen icon anymore.
 */
const appIconSource = path.join(root, "public", "Rotompc-app-icon.png");

const output192 = path.join(root, "public", "rotompc-app-icon-192.png");

const output512 = path.join(root, "public", "rotompc-app-icon-512.png");

const outputMaskable = path.join(
  root,
  "public",
  "rotompc-app-icon-maskable-512.png",
);

const outputApple = path.join(root, "public", "rotompc-apple-touch-icon.png");

/* =========================================================
   CHECK SOURCE
========================================================= */

const assertSourceExists = () => {
  if (fs.existsSync(appIconSource)) {
    return;
  }

  throw new Error(
    [
      "PWA icon source was not found.",
      "",
      `Expected: ${appIconSource}`,
      "",
      "Add this file first:",
      "rotompc-client/public/Rotompc-app-icon.png",
    ].join("\n"),
  );
};

/* =========================================================
   GENERATE
========================================================= */

const generateIcons = async () => {
  assertSourceExists();

  console.log("Generating RotomPC home-screen/PWA icons...");

  console.log("Source: public/Rotompc-app-icon.png");

  console.log("");

  /* =====================================================
       192 × 192

       Standard Android/PWA icon.
    ===================================================== */

  await sharp(appIconSource)
    .resize(192, 192, {
      fit: "contain",

      position: "center",

      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    })
    .png()
    .toFile(output192);

  console.log("✓ rotompc-app-icon-192.png");

  /* =====================================================
       512 × 512

       Large Android/PWA icon.
    ===================================================== */

  await sharp(appIconSource)
    .resize(512, 512, {
      fit: "contain",

      position: "center",

      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    })
    .png()
    .toFile(output512);

  console.log("✓ rotompc-app-icon-512.png");

  /* =====================================================
       APPLE TOUCH ICON
       180 × 180

       Uses Rotompc-app-icon.png, NOT the browser SVG.

       A solid background is preferable for iOS home-screen
       icons because iOS does not treat transparent app icons
       the same way a browser favicon is treated.
    ===================================================== */

  const appleArtwork = await sharp(appIconSource)
    .resize(164, 164, {
      fit: "contain",

      position: "center",
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 180,

      height: 180,

      channels: 4,

      background: {
        r: 204,
        g: 0,
        b: 0,
        alpha: 1,
      },
    },
  })
    .composite([
      {
        input: appleArtwork,

        gravity: "centre",
      },
    ])
    .png()
    .toFile(outputApple);

  console.log("✓ rotompc-apple-touch-icon.png");

  /* =====================================================
       MASKABLE ANDROID ICON
       512 × 512

       Android may crop maskable icons into:
       - circles
       - rounded squares
       - squircles
       - other launcher shapes

       The artwork stays inside the safe central region.
    ===================================================== */

  const safeArtwork = await sharp(appIconSource)
    .resize(360, 360, {
      fit: "contain",

      position: "center",
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,

      height: 512,

      channels: 4,

      background: {
        r: 204,
        g: 0,
        b: 0,
        alpha: 1,
      },
    },
  })
    .composite([
      {
        input: safeArtwork,

        gravity: "centre",
      },
    ])
    .png()
    .toFile(outputMaskable);

  console.log("✓ rotompc-app-icon-maskable-512.png");

  console.log("");

  console.log("RotomPC PWA icons generated successfully.");

  console.log("");

  console.log("Browser favicon remains:");

  console.log("public/rotompc-icon.svg");
};

/* =========================================================
   RUN
========================================================= */

generateIcons().catch((error) => {
  console.error("Unable to generate RotomPC PWA icons:", error);

  process.exit(1);
});
