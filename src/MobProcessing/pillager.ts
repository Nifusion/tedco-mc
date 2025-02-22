import { HandItem, HandItems, SummonEntityCommand } from "../summonEntityCommand";
import { randomNumber } from "../mathUtils";
import { Redemption } from "../redemptionProcessor";
import { sendCommand } from "../serverManager";
import {
  rollForLeftHanded
} from "./defaults";
import { TippedArrowEffects } from "./summonsUtils";

export function processPillager(payload: Redemption) {
  let summon = new SummonEntityCommand(payload.ign, "minecraft:pillager");
  summon.setCustomName(payload.namedAfter);

  if (rollForLeftHanded()) {
    summon.setLeftHanded();
  }

  summon.withHandItems(
    new HandItems().withMainHand(new HandItem("minecraft:crossbow"))
  );

  if (randomNumber(1, 10) === 1) {
    // get special arrows
    if (randomNumber(1, 2) === 1)
      summon.withHandItems(
        new HandItems().withOffHand(
          new HandItem("minecraft:tipped_arrow").withTippedArrows(
            rollForPositiveTippedArrow()
          )
        )
      );
    else
      summon.withHandItems(
        new HandItems().withOffHand(
          new HandItem("minecraft:tipped_arrow").withTippedArrows(
            rollForNegativeTippedArrow()
          )
        )
      );
  } else {
    //get regular arrows
    //  no need to roll off hand
  }

  sendCommand(summon);
}

const PositiveTippedArrowEffects: TippedArrowEffects[] = [
  "minecraft:regeneration",
  "minecraft:strong_regeneration",
  "minecraft:swiftness",
  "minecraft:long_swiftness",
  "minecraft:strength",
  "minecraft:long_strength",
  "minecraft:leaping",
  "minecraft:long_leaping",
  "minecraft:healing",
  "minecraft:strong_healing",
  "minecraft:long_night_vision",
  "minecraft:long_water_breathing",
  "minecraft:long_slow_falling",
];

const NegativeTippedArrowEffects: TippedArrowEffects[] = [
  "minecraft:slowness",
  "minecraft:turtle_master",
  "minecraft:strong_turtle_master",
  "minecraft:weakness",
  "minecraft:water_breathing",
  "minecraft:oozing",
  "minecraft:weaving",
];

function rollForPositiveTippedArrow(): TippedArrowEffects {
  const roll = randomNumber(1, PositiveTippedArrowEffects.length);
  return PositiveTippedArrowEffects[roll - 1];
}

function rollForNegativeTippedArrow(): TippedArrowEffects {
  const roll = randomNumber(1, NegativeTippedArrowEffects.length);
  return NegativeTippedArrowEffects[roll - 1];
}
