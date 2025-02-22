import { ICommand } from "./ICommand";

export class DirectCommand implements ICommand {
  command: String;

  constructor(command: string) {
    this.command = command;
  }

  toString(): String {
    return this.command;
  }
}
