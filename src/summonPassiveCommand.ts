import { ICommand } from "./ICommand";
import { randomNumberNoFloor } from "./mathUtils";
import { MobIds, TippedArrowEffects } from "./MobProcessing/summonsUtils";

type catVariant =
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

type parrotVariant = 0 | 1 | 2 | 3 | 4;
type rabbitVariant = 0 | 1 | 2 | 3 | 4 | 5 | 99;
type sheepVariant =
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

type frogVariant = "cold" | "temperate" | "warm";

type wolfVariant =
  | "pale"
  | "woods"
  | "ashen"
  | "black"
  | "chestnut"
  | "rusty"
  | "spotted"
  | "striped"
  | "snowy";

type horseVariant =
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

type llamaVariant = 0 | 1 | 2 | 3;

type pandaGene =
  | "normal"
  | "aggressive"
  | "lazy"
  | "worried"
  | "playful"
  | "weak"
  | "brown";

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

  constructor(executeAt: string, mob: MobIds) {
    this.executeAt = executeAt;
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

  setChicken(eggLayTime: number) {
    this.NBT.EggLayTime = 999999;
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

  toString(): String {
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
