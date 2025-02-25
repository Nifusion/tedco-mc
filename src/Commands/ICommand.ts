export interface ICommand {
  toString: () => string;
  type?: CommandType;
}

export type CommandType =
  | "Direct"
  | "Attribute"
  | "SummonRandomEntity"
  | "SummonRandomPassive";

export class CommandCluster extends Array<ICommand> {}
