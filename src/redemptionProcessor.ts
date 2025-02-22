import { coinFlip, processDirect } from "./MobProcessing/defaults";
import { processHusk } from "./MobProcessing/husk";
import { processPillager } from "./MobProcessing/pillager";
import { processSkeleton } from "./MobProcessing/skeleton";
import {
  RandomHostileMobIds,
  RandomPassiveMobIds,
} from "./MobProcessing/summonsUtils";
import { processZombie } from "./MobProcessing/zombie";
import { processZombieVillager } from "./MobProcessing/zombie_villager";
import { processZombifiedPiglin } from "./MobProcessing/zombified_piglin";
import { DirectCommand } from "./directCommand";
import { randomNumber } from "./mathUtils";
import { sendCommand } from "./serverManager";
import { SummonPassiveCommand } from "./summonPassiveCommand";
import {
  randomCatVariant,
  randomFrogVariant,
  randomHorseVariant,
  randomLlamaVariant,
  randomPandaGene,
  randomParrotVariant,
  randomRabbitVariant,
  randomSheepVariant,
  randomWolfVariant,
} from "./variants";

interface IRedemptionDictionary {
  [key: string]: (payload: Redemption) => void;
}

export type Redemption = {
  eventTitle: string;
  ign: string;
  namedAfter: string;
  amount: number;
};

export const RedemptionDictionary: IRedemptionDictionary = {
  Heal: (payload) => handleHealCluster(payload),
  Random: (payload) => handleRandomHostileMob(payload),
  Passive: (payload) => handleRandomPassiveMob(payload),
  "Gib Hug Now Ted": (payload) => handleRandomHostileMob(payload),
};

export function ProcessRedemption(payload: Redemption) {
  const { eventTitle } = payload;
  const output = RedemptionDictionary[eventTitle];

  if (output) output(payload);

  return undefined;
}

function handleRandomHostileMob(payload: Redemption) {
  const { amount, namedAfter, ign } = payload;

  console.log(
    `Rolling Mobs to spawn on ${ign} for ${namedAfter}, amount ${amount}`
  );

  //  take USD amount and floor it to nearest whole number
  const numberOfRolls = Math.floor(amount);

  for (let i = 0; i < numberOfRolls; i++) {
    const commandRoll = randomNumber(1, 10001);

    let rolledMob: RandomHostileMobIds = "minecraft:armor_stand";

    if (commandRoll <= 6000) {
      const possibleMobs: RandomHostileMobIds[] = [
        "minecraft:zombie",
        "minecraft:skeleton",
        "minecraft:spider",
        "minecraft:husk",
        "minecraft:endermite",
        "minecraft:zombie_villager",
        "minecraft:zombified_piglin",
      ];

      rolledMob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
    } else if (commandRoll <= 8500) {
      const possibleMobs: RandomHostileMobIds[] = [
        "minecraft:phantom",
        "minecraft:breeze",
        "minecraft:pillager",
      ];

      rolledMob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
    } else if (commandRoll <= 10000) {
      const possibleMobs: RandomHostileMobIds[] = [
        "minecraft:blaze",
        "minecraft:evoker",
        "minecraft:guardian",
        "minecraft:witch",
      ];

      rolledMob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
    } else if (commandRoll <= 10001) {
      const possibleMobs: RandomHostileMobIds[] = [
        "minecraft:wither",
        "minecraft:warden",
      ];

      rolledMob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
    }

    console.log("Rolled Mob", rolledMob);

    processRolledHostileMob(rolledMob, payload);
  }
}

function handleRandomPassiveMob(payload: Redemption) {
  const { amount, namedAfter, ign } = payload;

  console.log(
    `Rolling Mobs to spawn on ${ign} for ${namedAfter}, amount ${amount}`
  );

  //  take USD amount and floor it to nearest whole number
  const numberOfRolls = Math.floor(amount);

  for (let i = 0; i < numberOfRolls; i++) {
    const commandRoll = randomNumber(1, 101);

    let rolledMob: RandomPassiveMobIds = "minecraft:armor_stand";

    let possibleMobs: RandomPassiveMobIds[] = ["minecraft:armor_stand"];
    if (commandRoll <= 50) {
      possibleMobs = [
        "minecraft:cow",
        "minecraft:pig",
        "minecraft:sheep",
        "minecraft:cat",
        "minecraft:ocelot",
        "minecraft:wolf",
        "minecraft:chicken",
        "minecraft:rabbit",
      ];
    } else if (commandRoll <= 80) {
      possibleMobs = [
        "minecraft:bee",
        "minecraft:fox",
        "minecraft:frog",
        "minecraft:goat",
        "minecraft:armadillo",
        "minecraft:parrot",
        "minecraft:sniffer",
        "minecraft:strider",
      ];
    } else if (commandRoll <= 100) {
      possibleMobs = [
        "minecraft:camel",
        "minecraft:donkey",
        "minecraft:horse",
        "minecraft:iron_golem",
        "minecraft:llama",
        "minecraft:mooshroom",
        "minecraft:mule",
        "minecraft:panda",
        "minecraft:polar_bear",
        "minecraft:snow_golem",
      ];
    } else if (commandRoll <= 101) {
      possibleMobs = ["minecraft:skeleton_horse", "minecraft:zombie_horse"];
    }

    rolledMob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];

    console.log("Rolled Mob", rolledMob);

    processRolledPassiveMob(rolledMob, payload);
  }
}

function handleHealCluster(payload: Redemption) {
  const { ign } = payload;

  const commandRoll = randomNumber(1, 101);
  if (commandRoll <= 10) {
    sendCommand(new DirectCommand(`give ${ign} minecraft:golden_apple 1`));
  } else if (commandRoll <= 40) {
    sendCommand(new DirectCommand(`smackdatass ${ign}`));
  } else if (commandRoll <= 80) {
    const count = 3;
    sendCommand(new DirectCommand(`floatyheals ${ign} ${count}`));
  } else if (commandRoll <= 100) {
    const count = 2;
    sendCommand(new DirectCommand(`makeitrainheals ${ign} ${count}`));
  } else if (commandRoll <= 101) {
    sendCommand(
      new DirectCommand(`effect give ${ign} minecraft:health_boost 60 24 true`)
    );

    sendCommand(new DirectCommand(`floatyheals ${ign} ${10}`));
    sendCommand(new DirectCommand(`floatyheals ${ign} ${10}`));
    sendCommand(new DirectCommand(`floatyheals ${ign} ${10}`));

    sendCommand(new DirectCommand(`makeitrainheals ${ign} ${2}`));
    sendCommand(new DirectCommand(`makeitrainheals ${ign} ${2}`));
    sendCommand(new DirectCommand(`makeitrainheals ${ign} ${2}`));

    sendCommand(
      new DirectCommand(
        `tellraw ${ign} "That's not supposed to be like that..."`
      )
    );
  }
}

function processRolledHostileMob(
  mob: RandomHostileMobIds,
  payload: Redemption
) {
  switch (mob) {
    case "minecraft:zombie":
      processZombie(payload);
      break;
    case "minecraft:skeleton":
      processSkeleton(payload);
      break;
    case "minecraft:husk":
      processHusk(payload);
      break;
    case "minecraft:zombie_villager":
      processZombieVillager(payload);
      break;
    case "minecraft:zombified_piglin":
      processZombifiedPiglin(payload);
      break;
    case "minecraft:pillager":
      processPillager(payload);
      break;
    case "minecraft:endermite":
    case "minecraft:phantom":
    case "minecraft:breeze":
    case "minecraft:blaze":
    case "minecraft:evoker":
    case "minecraft:guardian":
    case "minecraft:witch":
    case "minecraft:spider":
    case "minecraft:wither":
    case "minecraft:warden":
      processDirect(payload, mob);
      break;
    default:
      payload.namedAfter = "Nifusion sucks at coding";
      processDirect(payload, "minecraft:armor_stand");
      break;
  }
}

function processRolledPassiveMob(
  mob: RandomPassiveMobIds,
  payload: Redemption
) {
  const summon = new SummonPassiveCommand(payload.ign, mob);
  summon.setCustomName(payload.namedAfter);

  const isBaby = randomNumber(1, 25) === 1;
  if (isBaby) summon.setAge(-25000);

  switch (mob) {
    case "minecraft:parrot":
      summon.setParrot(randomParrotVariant());
      break;
    case "minecraft:cat":
      summon.setCat(randomCatVariant());
      break;
    case "minecraft:frog":
      summon.setFrog(randomFrogVariant());
      break;
    case "minecraft:horse":
      summon.setHorse(randomHorseVariant());
      break;
    case "minecraft:llama":
      summon.setLlama(randomLlamaVariant());
      break;
    case "minecraft:wolf":
      summon.setWolf(randomWolfVariant());
      break;
    case "minecraft:rabbit":
      summon.setRabbit(randomRabbitVariant());
      break;
    case "minecraft:sheep":
      summon.setSheep(randomSheepVariant());
      break;
    case "minecraft:goat":
      summon.setGoat(randomNumber(1, 10) === 1, coinFlip(), coinFlip());
      break;
    case "minecraft:chicken":
      summon.setChicken();
      break;
    case "minecraft:panda":
      summon.setPanda(randomPandaGene(), randomPandaGene());
      break;
    case "minecraft:armadillo":
    case "minecraft:bee":
    case "minecraft:camel":
    case "minecraft:cow":
    case "minecraft:donkey":
    case "minecraft:fox":
    case "minecraft:iron_golem":
    case "minecraft:mooshroom":
    case "minecraft:mule":
    case "minecraft:ocelot":
    case "minecraft:pig":
    case "minecraft:polar_bear":
    case "minecraft:skeleton_horse":
    case "minecraft:sniffer":
    case "minecraft:snow_golem":
    case "minecraft:strider":
    case "minecraft:zombie_horse":
      break;
    default:
      payload.namedAfter = "Nifusion sucks at coding";
      processDirect(payload, "minecraft:armor_stand");
      break;
  }

  sendCommand(summon);
}
