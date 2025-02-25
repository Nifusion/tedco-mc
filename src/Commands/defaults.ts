import {
  ArmorItem,
  ArmorItems,
  HandItem,
  HandItems,
  SummonEntityCommand,
} from "./summonEntityCommand";
import { randomNumber } from "../Utils/mathUtils";
import { MobHoldingItem, MobWearingItem } from "./summonsUtils";

export function coinFlip(): boolean {
  return randomNumber(1, 100) > 50;
}

export function rollForLeftHanded(): boolean {
  return randomNumber(1, 10) === 1;
}

export function rollForBaby(): boolean {
  return randomNumber(1, 25) === 1;
}

export function rollForGetMainHand(force: boolean = false): boolean {
  if (force) return force;
  return randomNumber(1, 100) > 75;
}

export function rollForGetOffHand(force: boolean = false): boolean {
  if (force) return force;
  return randomNumber(1, 100) > 90;
}

export function rollForMainHand(): MobHoldingItem {
  const unfortunate = randomNumber(1, 1000);
  if (unfortunate === 1) return "minecraft:totem_of_undying";

  const mainHandRoll = randomNumber(1, mainHandSelections.length);
  return mainHandSelections[mainHandRoll - 1];
}

export function rollForOffHand(): MobHoldingItem {
  const unfortunate = randomNumber(1, 1000);
  if (unfortunate === 1) return "minecraft:totem_of_undying";

  const offHandRoll = randomNumber(1, offHandSelections.length);
  return offHandSelections[offHandRoll - 1];
}

export function rollForGetHelmet(force: boolean = false): boolean {
  if (force) return force;
  return randomNumber(1, 100) > 75;
}
export function rollForGetChestplate(force: boolean = false): boolean {
  if (force) return force;
  return randomNumber(1, 100) > 75;
}
export function rollForGetLeggings(force: boolean = false): boolean {
  if (force) return force;
  return randomNumber(1, 100) > 75;
}
export function rollForGetBoots(force: boolean = false): boolean {
  if (force) return force;
  return randomNumber(1, 100) > 75;
}

export function rollForHelmet(
  force: MobWearingItem = "minecraft:air"
): MobWearingItem {
  if (force != "minecraft:air") return force;
  const roll = randomNumber(1, headArmorSelections.length);
  return headArmorSelections[roll - 1];
}
export function rollForChestplate(
  force: MobWearingItem = "minecraft:air"
): MobWearingItem {
  if (force != "minecraft:air") return force;
  const roll = randomNumber(1, chestArmorSelections.length);
  return chestArmorSelections[roll - 1];
}
export function rollForLeggings(
  force: MobWearingItem = "minecraft:air"
): MobWearingItem {
  if (force != "minecraft:air") return force;
  const roll = randomNumber(1, legsArmorSelections.length);
  return legsArmorSelections[roll - 1];
}
export function rollForBoots(
  force: MobWearingItem = "minecraft:air"
): MobWearingItem {
  if (force != "minecraft:air") return force;
  const roll = randomNumber(1, feetArmorSelections.length);
  return feetArmorSelections[roll - 1];
}

export const mainHandSelections: MobHoldingItem[] = [
  "minecraft:stick",
  "minecraft:stick",
  "minecraft:stick",
  "minecraft:wooden_shovel",
  "minecraft:wooden_sword",
  "minecraft:wooden_pickaxe",
  "minecraft:wooden_hoe",
  "minecraft:wooden_hoe",
  "minecraft:golden_shovel",
  "minecraft:golden_sword",
  "minecraft:golden_pickaxe",
  "minecraft:golden_hoe",
  "minecraft:leather_leggings",
  "minecraft:bone",
  "minecraft:phantom_membrane",
  "minecraft:fishing_rod",
  "minecraft:cod",
  "minecraft:firework_star",
  "minecraft:shield",
  "minecraft:shield",
];

export const offHandSelections: MobHoldingItem[] = [
  "minecraft:shield",
  "minecraft:diamond",
  "minecraft:emerald",
  "minecraft:writable_book",
];

export const headArmorSelections: MobWearingItem[] = [
  "minecraft:leather_helmet",
  "minecraft:chainmail_helmet",
  "minecraft:golden_helmet",
  "minecraft:turtle_helmet",
];
export const chestArmorSelections: MobWearingItem[] = [
  "minecraft:leather_chestplate",
  "minecraft:chainmail_chestplate",
  "minecraft:golden_chestplate",
];
export const legsArmorSelections: MobWearingItem[] = [
  "minecraft:leather_leggings",
  "minecraft:chainmail_leggings",
  "minecraft:golden_leggings",
];
export const feetArmorSelections: MobWearingItem[] = [
  "minecraft:leather_boots",
  "minecraft:chainmail_boots",
  "minecraft:golden_boots",
];

export function rollDefaultArmor(summonCommand: SummonEntityCommand) {
  if (rollForGetHelmet()) {
    summonCommand.withArmor(
      new ArmorItems().withHead(new ArmorItem(rollForHelmet()))
    );
  }
  if (rollForGetChestplate()) {
    summonCommand.withArmor(
      new ArmorItems().withChest(new ArmorItem(rollForChestplate()))
    );
  }
  if (rollForGetLeggings()) {
    summonCommand.withArmor(
      new ArmorItems().withLegs(new ArmorItem(rollForLeggings()))
    );
  }
  if (rollForGetBoots()) {
    summonCommand.withArmor(
      new ArmorItems().withFeet(new ArmorItem(rollForBoots()))
    );
  }
}

export function rollDefaultHandItems(summon: SummonEntityCommand) {
  if (rollForGetMainHand()) {
    summon.withHandItems(
      new HandItems().withMainHand(new HandItem(rollForMainHand()))
    );
  }

  if (rollForGetOffHand()) {
    summon.withHandItems(
      new HandItems().withOffHand(new HandItem(rollForOffHand()))
    );
  }
}
