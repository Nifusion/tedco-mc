import { ChildProcess, spawn } from "child_process";
import path from "path";
import { ProcessRedemption } from "./redemptionProcessor";
import { ICommand } from "./ICommand";
import { DirectCommand } from "./directCommand";
import { pauseQueue, resumeQueue } from "./commandQueue";

const SERVER_FOLDER = path.join(path.dirname(__dirname), "server");
const SERVER_JAR = path.join(SERVER_FOLDER, "/paper.jar");

let mcServer: ChildProcess | null = null;

export function startServerInstance() {
  if (!mcServer) {
    mcServer = spawn(
      "java",
      ["-Xmx4G", "-Xms4G", "-jar", SERVER_JAR, "nogui"],
      {
        cwd: SERVER_FOLDER,
      }
    );

    mcServer?.stdout?.on("data", (data: string) => {
      const commandPattern = /(\S+)\s+issued\s+server\s+command:\s+\/(\S+)/;
      const match = String(data)
        .replace("\r", "")
        .replace("\n", "")
        .match(commandPattern);

      if (match) {
        const playerName = match[1];
        const commandName = match[2];
        console.log(
          `Detected ${commandName} command from player: ${playerName}`
        );

        if (commandName === "panic") {
          console.log(`${playerName} issued the /panic command.`);
          sendCommand(
            new DirectCommand(
              `execute as @e[tag=serverSpawned,tag=${playerName},distance=..128] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1}`
            )
          );

          sendCommand(
            new DirectCommand(
              `execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:1, Silent:1, Invulnerable:1}`
            )
          );

          pauseQueue(playerName);
        }

        if (commandName === "unpanic") {
          console.log(`${playerName} issued the /panic command.`);
          sendCommand(
            new DirectCommand(
              `execute as @e[tag=serverSpawned,tag=${playerName}] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
            )
          );

          sendCommand(
            new DirectCommand(
              `execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
            )
          );

          resumeQueue(playerName);
        }

        return;
      }

      if (data.indexOf("!testheal") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Heal",
            ign: matches[0],
            namedAfter: "TestCommand",
          });
        }
      }

      if (data.indexOf("!testrandom") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Random",
            ign: matches[0],
            namedAfter: "TestCommand",
          });
        }
      }

      if (data.indexOf("!testpassive") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 1,
            eventTitle: "Passive",
            ign: matches[0],
            namedAfter: "TestCommand",
          });
        }
      }

      if (data.indexOf("!testsub") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 5,
            eventTitle: "Random",
            ign: matches[0],
            namedAfter: "TestCommand",
          });
        }
      }

      console.error(`MC DATA: ${data.toString()}`);
    });
    mcServer?.stderr?.on("data", (data) => {
      console.error(`MC ERROR: ${data.toString()}`);
    });
    mcServer?.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
      mcServer = null;
    });
  }
}

export function sendCommand(command: ICommand): boolean {
  if (!mcServer) return false;

  console.log(command.toString());

  mcServer?.stdin?.write(command.toString() + "\n");

  return true;
}

export function getServerProcess(): ChildProcess | null {
  return mcServer;
}
