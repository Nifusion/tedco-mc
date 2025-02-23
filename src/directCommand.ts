import { ICommand } from "./ICommand";

export class DirectCommand implements ICommand {
  command: string;

  constructor(command: string) {
    this.command = command;
  }

  toString(): string {
    return this.command;
  }
}
