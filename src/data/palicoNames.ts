export const PALICO_NAMES = [
  "Mewsen",
  "Whiskers",
  "Purrfect",
  "Felyne",
  "Meowscular",
  "Tabby",
  "Clawsome",
  "Paws",
  "Mrow",
  "Huntercat",
  "Fuzzy",
  "Scratch",
  "Neko",
  "Munchkin",
  "Tiggy",
];

export function randomPalicoName(): string {
  return PALICO_NAMES[Math.floor(Math.random() * PALICO_NAMES.length)]!;
}
