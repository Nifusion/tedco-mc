import { CommandCluster, CommandType, ICommand } from "./ICommand";

type AttributeOperation = "set" | "reset";
type ValidAttributes = "minecraft:scale";

export class AttributeCommand implements ICommand {
  private target: string;
  attribute?: ValidAttributes;
  operation?: AttributeOperation;
  value?: number;
  type: CommandType = "Attribute";

  constructor(target: string) {
    this.target = target;
  }

  setAttribute(attribute: ValidAttributes, value?: number): this {
    if (value === undefined) {
      throw new Error("Value must be provided for 'set' operation");
    }

    this.attribute = attribute;
    this.operation = "set";
    this.value = value;
    return this;
  }

  resetAttribute(attribute: ValidAttributes): this {
    this.attribute = attribute;
    this.operation = "reset";
    return this;
  }

  toString(): string {
    let command = "";

    if (!this.attribute) throw "Attribute Command not set properly.";

    const { attribute, operation, value } = this;
    if (operation === "reset") {
      command += `attribute ${this.target} ${attribute} base reset`;
    } else if (operation === "set" && value !== undefined) {
      command += `attribute ${this.target} ${attribute} base set ${value}`;
    }

    return command;
  }
}

export const resetAllKnownAttributes = (player: string): CommandCluster => {
  return new CommandCluster(
    new AttributeCommand(player).resetAttribute("minecraft:scale")
  );
};
