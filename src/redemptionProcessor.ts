import {
  coinFlip,
  rollDefaultArmor,
  rollDefaultHandItems,
  rollForBaby,
  rollForLeftHanded,
  rollForMainHand,
} from "./MobProcessing/defaults";
import {
  RandomHostileMobIds,
  RandomPassiveMobIds,
  TippedArrowEffects,
} from "./MobProcessing/summonsUtils";
import { addCommand } from "./commandQueue";
import { DirectCommand } from "./directCommand";
import { randomNumber } from "./mathUtils";
import {
  HandItem,
  HandItems,
  SummonEntityCommand,
} from "./summonEntityCommand";
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
  force?: string;
};

export const RedemptionDictionary: IRedemptionDictionary = {
  Heal: (payload) => handleHealCluster(payload),
  Random: (payload) => handleRandomHostileMob(payload),
  Passive: (payload) => handleRandomPassiveMob(payload),
  "Gib Hug Now Ted": (payload) => handleRandomHostileMob(payload),
  "*": (payload) => handleRandomHostileMob(payload),
};

export function ProcessRedemption(payload: Redemption) {
  const { eventTitle } = payload;
  const output = RedemptionDictionary[eventTitle];

  if (output) output(payload);
  else RedemptionDictionary["*"](payload);

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
    let possibleMobs: RandomHostileMobIds[] = ["minecraft:armor_stand"];

    if (commandRoll <= 6500) {
      possibleMobs = [
        "minecraft:zombie",
        "minecraft:skeleton",
        "minecraft:spider",
        "minecraft:husk",
        "minecraft:zombie_villager",
        "minecraft:zombified_piglin",
      ];
    } else if (commandRoll <= 9500) {
      possibleMobs = [
        "minecraft:breeze",
        "minecraft:pillager",
        "minecraft:endermite",
        "minecraft:blaze",
        "minecraft:llama",
      ];
    } else if (commandRoll <= 10000) {
      possibleMobs = [
        "minecraft:evoker",
        "minecraft:guardian",
        "minecraft:witch",
        "minecraft:phantom",
        "minecraft:enderman",
      ];
    } else if (commandRoll <= 10001) {
      possibleMobs = ["minecraft:wither", "minecraft:warden"];
    }
    rolledMob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];

    console.log("Rolled Mob", rolledMob);

    if (payload.force) rolledMob = payload.force as RandomHostileMobIds;

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

    if (payload.force) rolledMob = payload.force as RandomPassiveMobIds;

    console.log("Rolled Mob", rolledMob);

    processRolledPassiveMob(rolledMob, payload);
  }
}

function handleHealCluster(payload: Redemption) {
  const { ign } = payload;

  const commandRoll = randomNumber(1, 101);
  if (commandRoll <= 10) {
    addCommand(ign, new DirectCommand(`give ${ign} minecraft:golden_apple 1`));
  } else if (commandRoll <= 40) {
    addCommand(ign, new DirectCommand(`smackdatass ${ign}`));
  } else if (commandRoll <= 80) {
    const count = 3;
    addCommand(ign, new DirectCommand(`floatyheals ${ign} ${count}`));
  } else if (commandRoll <= 100) {
    const count = 2;
    addCommand(ign, new DirectCommand(`makeitrainheals ${ign} ${count}`));
  } else if (commandRoll <= 101) {
    addCommand(
      ign,
      new DirectCommand(`effect give ${ign} minecraft:health_boost 60 24 true`)
    );

    addCommand(ign, new DirectCommand(`floatyheals ${ign} ${10}`));
    addCommand(ign, new DirectCommand(`floatyheals ${ign} ${10}`));
    addCommand(ign, new DirectCommand(`floatyheals ${ign} ${10}`));

    addCommand(ign, new DirectCommand(`makeitrainheals ${ign} ${2}`));
    addCommand(ign, new DirectCommand(`makeitrainheals ${ign} ${2}`));
    addCommand(ign, new DirectCommand(`makeitrainheals ${ign} ${2}`));

    addCommand(
      ign,
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
  let summon = new SummonEntityCommand(payload.ign, mob);
  summon.setCustomName(payload.namedAfter);

  if (rollForBaby()) {
    summon.setIsBaby();
  }

  switch (mob) {
    case "minecraft:skeleton":
      //  80% chance to get a weapon
      if (randomNumber(1, 100) <= 80) {
        //  1 in 5 chance to get melee
        if (randomNumber(1, 5) === 1) {
          summon.withHandItems(
            new HandItems().withMainHand(new HandItem(rollForMainHand()))
          );
        } else {
          // else get ranged
          summon.withHandItems(
            new HandItems().withMainHand(new HandItem("minecraft:bow"))
          );

          if (randomNumber(1, 10) === 1) {
            // get special arrows
            if (randomNumber(1, 2) === 1)
              summon.withHandItems(
                new HandItems().withOffHand(
                  new HandItem("minecraft:tipped_arrow").withTippedArrows(
                    rollForPositiveTippedArrow()
                  )
                )
              );
            else
              summon.withHandItems(
                new HandItems().withOffHand(
                  new HandItem("minecraft:tipped_arrow").withTippedArrows(
                    rollForNegativeTippedArrow()
                  )
                )
              );
          } else {
            //get regular arrows
            //  no need to roll off hand
          }
        }
      }

      rollDefaultArmor(summon);
      break;
    case "minecraft:zombified_piglin":
      summon.withSecondaryCommand(
        new DirectCommand(
          `damage @e[tag=${summon.nifUUID},limit=1] 0.01 minecraft:player_attack by ${payload.ign}`
        )
      );
    case "minecraft:zombie":
    case "minecraft:husk":
    case "minecraft:zombie_villager":
      processDefaultMelee(summon);
      break;
    case "minecraft:warden":
    case "minecraft:enderman":
    case "minecraft:llama":
      summon.withSecondaryCommand(
        new DirectCommand(
          `damage @e[tag=${summon.nifUUID},limit=1] 0.01 minecraft:player_attack by ${payload.ign}`
        )
      );
      break;
    case "minecraft:pillager":
      summon.withHandItems(
        new HandItems().withMainHand(new HandItem("minecraft:crossbow"))
      );

      // get special arrows
      if (randomNumber(1, 10) === 1) {
        // get positive arrows
        if (randomNumber(1, 2) === 1)
          summon.withHandItems(
            new HandItems().withOffHand(
              new HandItem("minecraft:tipped_arrow").withTippedArrows(
                rollForPositiveTippedArrow()
              )
            )
          );
        else
          summon.withHandItems(
            new HandItems().withOffHand(
              new HandItem("minecraft:tipped_arrow").withTippedArrows(
                rollForNegativeTippedArrow()
              )
            )
          );
      } else {
        //get regular arrows
        //  no need to roll off hand
      }
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
      break;
    default:
      payload.namedAfter = "Nifusion sucks at coding";
      summon = new SummonEntityCommand(payload.ign, "minecraft:armor_stand");
      break;
  }

  addCommand(payload.ign, summon);
}

function processDefaultMelee(summon: SummonEntityCommand) {
  if (rollForLeftHanded()) {
    summon.setLeftHanded();
  }

  rollDefaultHandItems(summon);
  rollDefaultArmor(summon);
}

function processRolledPassiveMob(
  mob: RandomPassiveMobIds,
  payload: Redemption
) {
  let summon = new SummonPassiveCommand(payload.ign, mob);
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
      payload.namedAfter = "Nifusion sucks at coding";
      summon = new SummonPassiveCommand(payload.ign, "minecraft:armor_stand");
      break;
  }

  addCommand(payload.ign, summon);
}

const PositiveTippedArrowEffects: TippedArrowEffects[] = [
  "minecraft:regeneration",
  "minecraft:strong_regeneration",
  "minecraft:swiftness",
  "minecraft:long_swiftness",
  "minecraft:strength",
  "minecraft:long_strength",
  "minecraft:leaping",
  "minecraft:long_leaping",
  "minecraft:healing",
  "minecraft:strong_healing",
  "minecraft:long_night_vision",
  "minecraft:long_water_breathing",
  "minecraft:long_slow_falling",
];

const NegativeTippedArrowEffects: TippedArrowEffects[] = [
  "minecraft:slowness",
  "minecraft:turtle_master",
  "minecraft:strong_turtle_master",
  "minecraft:weakness",
  "minecraft:water_breathing",
  "minecraft:oozing",
  "minecraft:weaving",
];

function rollForPositiveTippedArrow(): TippedArrowEffects {
  const roll = randomNumber(1, PositiveTippedArrowEffects.length);
  return PositiveTippedArrowEffects[roll - 1];
}

function rollForNegativeTippedArrow(): TippedArrowEffects {
  const roll = randomNumber(1, NegativeTippedArrowEffects.length);
  return NegativeTippedArrowEffects[roll - 1];
}
