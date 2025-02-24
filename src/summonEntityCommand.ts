import { randomUUID } from "crypto";
import { DirectCommand } from "./directCommand";
import { CommandType, ICommand } from "./ICommand";
import {
  randomNumberNoFloor,
  randomNumberNoFloorExclusionZoneWithExclusion,
} from "./mathUtils";
import { MobIds, TippedArrowEffects } from "./MobProcessing/summonsUtils";

class NBT {
  ArmorItems: ArmorItems = new ArmorItems();
  HandItems: HandItems = new HandItems();
  Tags: string[] = ["serverSpawned"];
  Health?: string;
  PersistenceRequired: boolean = true;
  DeathLootTable: string = "";
  LeftHanded: boolean = false;
  CustomName?: string;
  CustomNameVisible: boolean = true;
  IsBaby: boolean = false;
  active_effects?: PotionEffect[];
  HandDropChances?: HandDropChances = new HandDropChances();
  ArmorDropChances?: ArmorDropChances = new ArmorDropChances();
  //  when wither spawns, you have 30 seconds (600 ticks) for it to charge up
  Invul: number = 600;
  
  constructor(nifUUID: string) {
    this.Tags.push(nifUUID);
  }

  toJSON(): any {
    const result = {
      ...this,
      CustomName: `ø${this.CustomName}ø`,
      Health: this.Health + "f",
    };

    if (this.Health) {
      result.Health = `${this.Health}f`;
    }

    return result;
  }
}

class ItemComponents {
  potion_contents?: Potion_Contents;

  toJSON(): any {
    if (this.potion_contents)
      return { "minecraft:potion_contents": this.potion_contents };

    return {};
  }
}

class Potion_Contents {
  potion?: string;

  constructor(potion?: string) {
    this.potion = potion;
  }
}

export class ArmorItem {
  id?: string;

  constructor(id?: string) {
    this.id = id;
  }

  toJSON(): any {
    if (this.id) return { count: 1, id: `${this.id}` };

    return {};
  }
}

export const EmptyArmorItem = new ArmorItem();

export class ArmorItems {
  feet?: ArmorItem;
  legs?: ArmorItem;
  chest?: ArmorItem;
  head?: ArmorItem = new ArmorItem("minecraft:stone_button");

  withFeet(feet?: ArmorItem) {
    this.feet = feet;
    return this;
  }

  withLegs(legs?: ArmorItem) {
    this.legs = legs;
    return this;
  }

  withChest(chest?: ArmorItem) {
    this.chest = chest;
    return this;
  }

  withHead(head?: ArmorItem) {
    this.head = head;
    return this;
  }

  toJSON(): any {
    if (this.feet || this.legs || this.chest || this.head)
      return [
        this.feet ?? EmptyArmorItem,
        this.legs ?? EmptyArmorItem,
        this.chest ?? EmptyArmorItem,
        this.head ?? EmptyArmorItem,
      ];

    return [];
  }
}

export class HandItem {
  id?: string;
  components?: ItemComponents;

  constructor(id?: string) {
    this.id = id;
  }

  withTippedArrows(effect: TippedArrowEffects): HandItem {
    if (!this.components) this.components = new ItemComponents();

    this.components.potion_contents = new Potion_Contents(effect);
    return this;
  }

  toJSON(): any {
    if (this.id)
      return { count: 1, id: `${this.id}`, components: this.components };

    return {};
  }
}

export const EmptyHandItem = new HandItem();

export class HandItems {
  mainHand?: HandItem;
  offHand?: HandItem;

  withMainHand(mainHand?: HandItem) {
    this.mainHand = mainHand;
    return this;
  }

  withOffHand(offHand?: HandItem) {
    this.offHand = offHand;
    return this;
  }

  toJSON(): any {
    if (this.mainHand || this.offHand)
      return [this.mainHand ?? EmptyHandItem, this.offHand ?? EmptyHandItem];
    return [];
  }
}

export class HandDropChances {
  mainHand: number = 0;
  offHand: number = 0;

  forceMainHand() {
    this.mainHand = 1;
    return this;
  }

  forceOffHand() {
    this.offHand = 1;
    return this;
  }

  toJSON(): any {
    return [this.mainHand + `f`, this.offHand + `f`];
  }
}

export class ArmorDropChances {
  feet: number = 0;
  legs: number = 0;
  chest: number = 0;
  head: number = 0;

  forceFeet() {
    this.feet = 1;
    return this;
  }

  forceLegs() {
    this.legs = 1;
    return this;
  }

  forceChest() {
    this.chest = 1;
    return this;
  }

  forceHead() {
    this.head = 1;
    return this;
  }

  toJSON(): any {
    return [
      this.feet + `f`,
      this.legs + `f`,
      this.chest + `f`,
      this.head + `f`,
    ];
  }
}

class PotionEffect {
  id: string;
  amplifier: number;
  duration: number;
  show_particles: boolean;

  constructor(
    id: string,
    amplifier: number,
    duration: number,
    show_particles: boolean
  ) {
    this.id = id;
    this.amplifier = amplifier;
    this.duration = duration;
    this.show_particles = show_particles;
  }
}

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
    if (armor.head) this.NBT.ArmorItems.withHead(armor.head);
    if (armor.chest) this.NBT.ArmorItems.withChest(armor.chest);
    if (armor.legs) this.NBT.ArmorItems.withLegs(armor.legs);
    if (armor.feet) this.NBT.ArmorItems.withFeet(armor.feet);

    return this;
  }

  withHandItems(handItems: HandItems) {
    if (handItems.mainHand) this.NBT.HandItems.withMainHand(handItems.mainHand);
    if (handItems.offHand) this.NBT.HandItems.withOffHand(handItems.offHand);

    return this;
  }

  setHandDropChances(chances: HandDropChances) {
    this.NBT.HandDropChances = chances;

    return this;
  }

  setArmorDropChances(chances: ArmorDropChances) {
    this.NBT.ArmorDropChances = chances;

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

    //  didn't bother to check values between 0f/1f because either
    //  we want it drop or we don't; yell at me later
    return command
      .replace(/\\/g, ``)
      .replace(/"0f"/g, "0f")
      .replace(/"1f"/g, "1f")
      .replace(/ø/g, '\\"');
  }
}
