import { DirectCommand, ICommand, SummonCommand } from "./commandBuilder";
import { sendCommand } from "./serverManager";

interface IRedemptionDictionary {
  [key: string]: (user: string, redeemer: string) => void;
}

export const RedemptionDictionary: IRedemptionDictionary = {
  "Gib Hug Now Ted": (user, redeemer) => handleHealCluster(user, redeemer),
  "Redemption 2": (user) =>
    new SummonCommand("minecraft:skeleton").executeAt(user),
  //"Redemption 3": (user) => new SummonCommand("minecraft:horse").executeAt(user),
};

export function ProcessRedemption(
  eventTitle: string,
  user: string,
  redeemer: string
): ICommand | undefined {
  const output = RedemptionDictionary[eventTitle];

  if (output) output(user, redeemer);

  return undefined;
}

function handleRandomMob(user: string) {
  // randomly pick a mob

  // random numbeer gen

  // go into number block

  // pick mob from random block

  //

  return new SummonCommand("minecraft:skeleton").executeAt(user);
}

function handleHealCluster(user: string, redeemer: string) {
  const roll = randomNumber(1, 101);
  if (roll >= 1 && roll <= 10) {
    sendCommand(new DirectCommand(`give ${user} minecraft:golden_apple 1`));
  } else if (roll >= 11 && roll <= 40) {
    sendCommand(new DirectCommand(`smackdatass ${user} ${redeemer}`));
  } else if (roll >= 41 && roll <= 80) {
    const count = 3;
    sendCommand(new DirectCommand(`floatyheals ${user} ${count} ${redeemer}`));
  } else if (roll >= 81 && roll <= 100) {
    const count = 2;
    sendCommand(new DirectCommand(`makeitrainheals ${user} ${count} ${redeemer}`));
  } else if (roll <= 101) {
    sendCommand(
      new DirectCommand(`effect give ${user} minecraft:health_boost 60 24 true`)
    );

    sendCommand(new DirectCommand(`floatyheals ${user} ${10}`));
    sendCommand(new DirectCommand(`floatyheals ${user} ${10}`));
    sendCommand(new DirectCommand(`floatyheals ${user} ${10}`));

    sendCommand(new DirectCommand(`makeitrainheals ${user} ${2}`));
    sendCommand(new DirectCommand(`makeitrainheals ${user} ${2}`));
    sendCommand(new DirectCommand(`makeitrainheals ${user} ${2}`));

    sendCommand(
      new DirectCommand(
        `tellraw ${user} "That's not supposed to be like that..."`
      )
    );
  }

  return new DirectCommand("say Oh well");
}

function randomNumber(low: number, high: number) {
  return Math.floor(Math.random() * high) + low;
}
