import { getRandomItem } from "../Utils/mathUtils";

export type catVariant =
  | "tabby"
  | "black"
  | "red"
  | "siamese"
  | "british_shorthair"
  | "calico"
  | "persian"
  | "ragdoll"
  | "white"
  | "jellie"
  | "all_black";

export const catVariants: catVariant[] = [
  "tabby",
  "black",
  "red",
  "siamese",
  "british_shorthair",
  "calico",
  "persian",
  "ragdoll",
  "white",
  "jellie",
  "all_black",
];

export const randomCatVariant = (): catVariant =>
  getRandomItem<catVariant>(catVariants);

export type parrotVariant = 0 | 1 | 2 | 3 | 4;
export const parrotVariants: parrotVariant[] = [0, 1, 2, 3, 4];
export const randomParrotVariant = (): parrotVariant =>
  getRandomItem<parrotVariant>(parrotVariants);

export type rabbitVariant = 0 | 1 | 2 | 3 | 4 | 5 | 99;
export const rabbitVariants: rabbitVariant[] = [0, 1, 2, 3, 4, 5, 99];
export const randomRabbitVariant = (): rabbitVariant =>
  getRandomItem<rabbitVariant>(rabbitVariants);

export type sheepVariant =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;
export const sheepVariants: sheepVariant[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];
export const randomSheepVariant = (): sheepVariant =>
  getRandomItem<sheepVariant>(sheepVariants);

export type frogVariant = "cold" | "temperate" | "warm";
export const frogVariants: frogVariant[] = ["cold", "temperate", "warm"];
export const randomFrogVariant = (): frogVariant =>
  getRandomItem<frogVariant>(frogVariants);

export type wolfVariant =
  | "pale"
  | "woods"
  | "ashen"
  | "black"
  | "chestnut"
  | "rusty"
  | "spotted"
  | "striped"
  | "snowy";
export const wolfVariants: wolfVariant[] = [
  "pale",
  "woods",
  "ashen",
  "black",
  "chestnut",
  "rusty",
  "spotted",
  "striped",
  "snowy",
];
export const randomWolfVariant = (): wolfVariant =>
  getRandomItem<wolfVariant>(wolfVariants);

export type horseVariant =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 256
  | 257
  | 258
  | 259
  | 260
  | 261
  | 262
  | 512
  | 513
  | 514
  | 515
  | 516
  | 517
  | 518
  | 768
  | 769
  | 770
  | 771
  | 772
  | 773
  | 774
  | 1024
  | 1025
  | 1026
  | 1027
  | 1028
  | 1029
  | 1030;
export const horseVariants: horseVariant[] = [
  0, 1, 2, 3, 4, 5, 6, 256, 257, 258, 259, 260, 261, 262, 512, 513, 514, 515,
  516, 517, 518, 768, 769, 770, 771, 772, 773, 774, 1024, 1025, 1026, 1027,
  1028, 1029, 1030,
];
export const randomHorseVariant = (): horseVariant =>
  getRandomItem<horseVariant>(horseVariants);

export type llamaVariant = 0 | 1 | 2 | 3;
export const llamaVariants: llamaVariant[] = [0, 1, 2, 3];
export const randomLlamaVariant = (): llamaVariant =>
  getRandomItem<llamaVariant>(llamaVariants);

export type pandaGene =
  | "normal"
  | "aggressive"
  | "lazy"
  | "worried"
  | "playful"
  | "weak"
  | "brown";
export const pandaGenes: pandaGene[] = [
  "normal",
  "aggressive",
  "lazy",
  "worried",
  "playful",
  "weak",
  "brown",
];
export const randomPandaGene = (): pandaGene =>
  getRandomItem<pandaGene>(pandaGenes);
