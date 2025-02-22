import { SummonEntityCommand } from "../summonEntityCommand";
import { Redemption } from "../redemptionProcessor";
import { sendCommand } from "../serverManager";
import {
  rollDefaultArmor,
  rollDefaultHandItems,
  rollForBaby,
  rollForLeftHanded,
} from "./defaults";

export function processZombifiedPiglin(payload: Redemption) {
  let summon = new SummonEntityCommand(payload.ign, "minecraft:zombified_piglin");
  summon.setCustomName(payload.namedAfter);

  if (rollForLeftHanded()) {
    summon.setLeftHanded();
  }

  if (rollForBaby()) {
    summon.setIsBaby();
  }

  rollDefaultHandItems(summon);
  rollDefaultArmor(summon);

  sendCommand(summon);
}
