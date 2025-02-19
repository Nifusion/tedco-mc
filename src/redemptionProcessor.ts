import { ICommand, SummonCommand } from "./commandBuilder";

interface IRedemptionDictionary {
  [key: string]: () => ICommand;
}

export const RedemptionDictionary: IRedemptionDictionary = {
  "Gib Hug Now Ted": () =>
    new SummonCommand("minecraft:zombie").executeAt("Nifusion"),
};

export function ProcessRedemption(eventTitle: string): ICommand | undefined {
  const output = RedemptionDictionary[eventTitle];

  if (output) return output();

  return undefined;
}
