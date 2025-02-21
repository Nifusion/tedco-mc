import { ChildProcess, spawn } from "child_process";
import path from "path";
import { ProcessRedemption } from "./redemptionProcessor";
import { ICommand } from "./ICommand";

const SERVER_FOLDER = path.join(path.dirname(__dirname), "server");
const SERVER_JAR = path.join(SERVER_FOLDER, "/paper.jar");

let mcServer: ChildProcess | null = null;

export function startServerInstance() {
  if (!mcServer) {
    mcServer = spawn(
      "C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\java.exe",
      ["-Xmx4G", "-Xms4G", "-jar", SERVER_JAR, "nogui"],
      {
        cwd: SERVER_FOLDER,
      }
    );

    mcServer?.stdout?.on("data", (data: string) => {
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

      if (data.indexOf("!testgift5") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 25,
            eventTitle: "Random",
            ign: matches[0],
            namedAfter: "TestCommand",
          });
        }
      }

      if (data.indexOf("!testgift10") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 50,
            eventTitle: "Random",
            ign: matches[0],
            namedAfter: "TestCommand",
          });
        }
      }

      if (data.indexOf("!testgift50") > -1) {
        const matchArray = String(data).match(/<([^>]+)>/g);
        const matches = matchArray ? matchArray.map((m) => m.slice(1, -1)) : [];
        if (matches.length >= 1) {
          ProcessRedemption({
            amount: 250,
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
