import { CommandType, ICommand } from "./ICommand";

export class DirectCommand implements ICommand {
  command: string;
  type: CommandType = "Direct";

  constructor(command: string) {
    this.command = command;
  }

  toString(): string {
    return this.command;
  }
}
