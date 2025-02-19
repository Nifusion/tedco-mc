import { MobIds } from "./summonsUtils";

export interface ICommand {
  toString: () => String;
}

interface VagueStringToAnyDictionary {
  [key: string]: any;
}

const DO_NOT_DROP_LOOT = { DeathLootTable: "" };

export class SummonCommand implements ICommand {
  _executeAt?: String;
  mob: MobIds;
  location: String;
  NBT: VagueStringToAnyDictionary = {
    DeathLootTable: "",
    Tags: ["nifSpawned"],
  };

  constructor(mob: MobIds, location?: String | null) {
    this.mob = mob;
    this.location = location ?? "~ ~1 ~";
  }

  executeAt(player: string): SummonCommand {
    this._executeAt = player;
    return this;
  }

  withNBT(args: VagueStringToAnyDictionary) {
    this.NBT = { ...this.NBT, ...args };
    return this;
  }

  toString(): String {
    let command = `summon ${this.mob} ${this.location} ${JSON.stringify(
      this.NBT
    )}`;

    if (this._executeAt) {
      command = `execute at ${this._executeAt} run ${command}`;
    }

    return command;
  }
}
