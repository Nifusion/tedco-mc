import { randomUUID } from "crypto";
import { randomNumberNoFloorExclusionZoneWithExclusion } from "../Utils/mathUtils";
import { MobIds, TippedArrowEffects } from "./summonsUtils";
import { CommandType, ICommand } from "./ICommand";
import {
  ArmorDropChances,
  ArmorItems,
  HandDropChances,
  HandItems,
  NBT,
} from "./MonsterNBT";

export class SummonEntityCommand implements ICommand {
  executeAt: String;
  mob: MobIds;
  secondary?: ICommand;
  nifUUID: string = randomUUID().toLocaleLowerCase();
  private NBT: NBT = new NBT(this.nifUUID);

  type: CommandType = "SummonRandomEntity";

  constructor(executeAt: string, mob: MobIds) {
    this.executeAt = executeAt.toLowerCase();
    this.NBT.Tags.push(executeAt.toLowerCase());
    this.mob = mob;
  }

  makeThemOneShot() {
    this.NBT.Health = "1";
  }

  withSecondaryCommand(command: ICommand) {
    this.secondary = command;
  }

  withArmor(armor: ArmorItems) {
    this.NBT.withArmor(armor);

    return this;
  }

  withHandItems(handItems: HandItems) {
    this.NBT.withHandItems(handItems);

    return this;
  }

  setHandDropChances(chances: HandDropChances) {
    this.NBT.setHandDropChances(chances);

    return this;
  }

  setArmorDropChances(chances: ArmorDropChances) {
    this.NBT.setArmorDropChances(chances);

    return this;
  }

  setLeftHanded() {
    this.NBT.LeftHanded = true;
    return this;
  }

  setIsBaby() {
    this.NBT.IsBaby = true;
    return this;
  }

  setCustomName(name: string) {
    this.NBT.CustomName = String(name).replace(/\"g/, "");
    return this;
  }

  overwriteNBT(NBT: NBT) {
    this.NBT = NBT;
    return this;
  }

  toString(): string {
    const zOffset = randomNumberNoFloorExclusionZoneWithExclusion(
      -1.5,
      1.5,
      -1,
      1
    );
    const xOffset = randomNumberNoFloorExclusionZoneWithExclusion(
      -1.5,
      1.5,
      -1,
      1
    );

    let command = `summon ${
      this.mob
    } ~${xOffset} ~1 ~${zOffset} ${JSON.stringify(this.NBT, null, 0)}`;

    if (this.executeAt) {
      command = `execute at ${this.executeAt} run ${command}`;
    }

    //  didn't bother to check values between 0f/1f because I'm lazy; yell at me later
    return command
      .replace(/\\/g, ``)
      .replace(/"0f"/g, "0f")
      .replace(/"1f"/g, "1f")
      .replace(/ø/g, '\\"');
  }
}
