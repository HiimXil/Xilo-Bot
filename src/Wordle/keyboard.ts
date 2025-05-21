import { createCanvas } from "canvas";

export type KeyState = "disabled" | "present" | "correct";

type KeyboardOptions = {
  keyStates: Record<string, KeyState>; // ex: { A: 'disabled', E: 'present', R: 'correct' }
};

const KEY_COLORS: Record<KeyState, { bg: string; fg: string }> = {
  disabled: { bg: "#ccc", fg: "#666" }, // gris
  present: { bg: "#FFF84D", fg: "#000" }, // jaune
  correct: { bg: "#88be00", fg: "#fff" }, // vert
};

const LAYOUT = [
  ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
  ["W", "X", "C", "V", "B", "N"],
];

export const generateKeyboardImage = ({ keyStates }: KeyboardOptions) => {
  const width = 450;
  const height = 150;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const keyWidth = 30;
  const keyHeight = 30;
  const paddingX = 7;
  const paddingY = 15;
  const offsetY = 15;

  ctx.font = "18px 'Comic Sans MS'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  LAYOUT.forEach((row, rowIndex) => {
    const totalRowWidth = row.length * keyWidth + (row.length - 1) * paddingX;
    const offsetX = (width - totalRowWidth) / 2;

    row.forEach((key, keyIndex) => {
      const x = offsetX + keyIndex * (keyWidth + paddingX);
      const y = offsetY + rowIndex * (keyHeight + paddingY);
      const keyUpper = key.toUpperCase();
      const state = keyStates[keyUpper];

      const colors = state ? KEY_COLORS[state] : { bg: "#fff", fg: "#000" };

      ctx.fillStyle = colors.bg;
      ctx.fillRect(x, y, keyWidth, keyHeight);

      ctx.fillStyle = colors.fg;
      ctx.fillText(keyUpper, x + keyWidth / 2, y + keyHeight / 2);
    });
  });

  return canvas.toBuffer("image/png");
};

// Exemple d'utilisation
const buffer = generateKeyboardImage({
  keyStates: {
    A: "disabled",
    Z: "present",
    E: "correct",
    Q: "disabled",
    R: "present",
  },
});
