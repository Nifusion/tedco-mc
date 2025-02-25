import { randomNumberNoFloor } from "../Utils/mathUtils";
import { MobIds } from "./summonsUtils";
import { CommandType, ICommand } from "./ICommand";
import {
  catVariant,
  frogVariant,
  horseVariant,
  llamaVariant,
  pandaGene,
  parrotVariant,
  rabbitVariant,
  sheepVariant,
  wolfVariant,
} from "./variants";

class NBT {
  Tags: string[] = ["serverSpawned"];
  PersistenceRequired: boolean = true;
  DeathLootTable: string = "";
  CustomName?: string;

  Age: number = 0;

  Variant:
    | parrotVariant
    | catVariant
    | frogVariant
    | horseVariant
    | llamaVariant
    | undefined = undefined;

  //  WHY DID WE LOWER CASE THIS?!
  variant?: wolfVariant = undefined;

  RabbitType?: rabbitVariant = undefined;

  Color?: sheepVariant = undefined;

  EggLayTime?: number = undefined;

  IsScreamingGoat?: boolean = undefined;
  HasRightHorn?: boolean = undefined;
  HasLeftHorn?: boolean = undefined;

  MainGene?: pandaGene = undefined;
  HiddenGene?: pandaGene = undefined;
}

export class SummonPassiveCommand implements ICommand {
  executeAt: String;
  mob: MobIds;
  private NBT: NBT = new NBT();

  type: CommandType = "SummonRandomPassive";

  constructor(executeAt: string, mob: MobIds) {
    this.executeAt = executeAt.toLowerCase();
    this.NBT.Tags.push(executeAt.toLowerCase());

    this.mob = mob;
  }

  setParrot(variant: parrotVariant) {
    this.NBT.Variant = variant;
  }

  setCat(variant: catVariant) {
    this.NBT.Variant = variant;
  }

  setFrog(variant: frogVariant) {
    this.NBT.Variant = variant;
  }

  setHorse(variant: horseVariant) {
    this.NBT.Variant = variant;
  }
  setLlama(variant: llamaVariant) {
    this.NBT.Variant = variant;
  }

  setWolf(variant: wolfVariant) {
    this.NBT.variant = variant;
  }

  setRabbit(variant: rabbitVariant) {
    this.NBT.RabbitType = variant;
  }

  setSheep(variant: sheepVariant) {
    this.NBT.Color = variant;
  }

  setChicken(eggLayTime?: number) {
    this.NBT.EggLayTime = eggLayTime ?? 999999;
  }

  setGoat(
    IsScreamingGoat: boolean,
    HasRightHorn: boolean,
    HasLeftHorn: boolean
  ) {
    this.NBT.IsScreamingGoat = IsScreamingGoat;
    this.NBT.HasRightHorn = HasRightHorn;
    this.NBT.HasLeftHorn = HasLeftHorn;
  }

  setPanda(MainGene: pandaGene, HiddenGene: pandaGene) {
    this.NBT.MainGene = MainGene;
    this.NBT.HiddenGene = HiddenGene;
  }

  setAge(age: number) {
    this.NBT.Age = age;
    return this;
  }

  setCustomName(name: string) {
    this.NBT.CustomName = name;
    return this;
  }

  overwriteNBT(NBT: NBT) {
    this.NBT = NBT;
    return this;
  }

  toString(): string {
    const zOffset = randomNumberNoFloor(-1.5, 1.5);
    const xOffset = randomNumberNoFloor(-1.5, 1.5);

    let command = `summon ${
      this.mob
    } ~${xOffset} ~1 ~${zOffset} ${JSON.stringify(this.NBT, null, 0)}`;

    if (this.executeAt) {
      command = `execute at ${this.executeAt} run ${command}`;
    }

    return command.replace(/\\/g, ``);
  }
}
