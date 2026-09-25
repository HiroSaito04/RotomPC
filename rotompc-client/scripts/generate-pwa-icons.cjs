// rotompc-client/scripts/generate-pwa-icons.cjs

const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");

const source = path.join(root, "public", "rotompc-icon.svg");

const output192 = path.join(root, "public", "rotompc-icon-192.png");

const output512 = path.join(root, "public", "rotompc-icon-512.png");

const outputMaskable = path.join(
  root,
  "public",
  "rotompc-icon-maskable-512.png",
);

const outputApple = path.join(root, "public", "rotompc-apple-touch-icon.png");

const generateIcons = async () => {
  console.log("Generating RotomPC PWA icons...");

  /* =======================================================
     192 × 192
  ======================================================= */

  await sharp(source)
    .resize(192, 192, {
      fit: "contain",
    })
    .png()
    .toFile(output192);

  console.log("✓ rotompc-icon-192.png");

  /* =======================================================
     512 × 512
  ======================================================= */

  await sharp(source)
    .resize(512, 512, {
      fit: "contain",
    })
    .png()
    .toFile(output512);

  console.log("✓ rotompc-icon-512.png");

  /* =======================================================
     APPLE TOUCH ICON
     180 × 180
  ======================================================= */

  await sharp(source)
    .resize(180, 180, {
      fit: "contain",

      background: {
        r: 255,
        g: 255,
        b: 255,
        alpha: 0,
      },
    })
    .png()
    .toFile(outputApple);

  console.log("✓ rotompc-apple-touch-icon.png");

  /* =======================================================
     MASKABLE ANDROID ICON

     Keep the actual Rotom artwork inside the center safe
     zone so Android launchers can crop it into circles,
     squircles, etc. without cutting off Rotom.
  ======================================================= */

  const safeIcon = await sharp(source)
    .resize(360, 360, {
      fit: "contain",
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
        input: safeIcon,

        gravity: "centre",
      },
    ])
    .png()
    .toFile(outputMaskable);

  console.log("✓ rotompc-icon-maskable-512.png");

  console.log("");
  console.log("RotomPC icons generated successfully.");
};

generateIcons().catch((error) => {
  console.error("Unable to generate RotomPC icons:", error);

  process.exit(1);
});
