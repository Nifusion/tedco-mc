import { DirectCommand } from "./directCommand";
import { ICommand } from "./ICommand";
import { sendCommand } from "./serverManager";

let queue: ICommand[] = [];
let processing = false;
let paused = false;
let intervalId: NodeJS.Timeout | null = null;
let countdownInterval: NodeJS.Timeout | null = null;
let finalInterval: NodeJS.Timeout | null = null;

export function addCommand(command: ICommand) {
  queue.push(command);
  if (!processing) start();
}

export function start() {
  if (processing || paused) return;
  processing = true;

  intervalId = setInterval(() => {
    if (queue.length > 0) {
      const command = queue.shift();
      if (command)
        try {
          sendCommand(command);
        } catch (error) {
          console.error("Error processing command:", command, error);
        }
    } else {
      stop();
    }
  }, 10);
}

export function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  processing = false;
}

export function pauseQueue(playerName: string) {
  if (paused) return;
  paused = true;
  console.log("Processing paused for 30 seconds.");

  let timeLeft = 30;

  countdownInterval = setInterval(() => {
    timeLeft -= 5;
    if (timeLeft > 5) {
      sendCommand(
        new DirectCommand(
          `tellraw ${playerName} "Unpausing in ${timeLeft} seconds... (Queued: ${queue.length})"`
        )
      );
    } else {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;

      let finalCountdown = 5;
      finalInterval = setInterval(() => {
        sendCommand(
          new DirectCommand(
            `tellraw ${playerName} "${finalCountdown}... (Queued: ${queue.length})"`
          )
        );
        finalCountdown--;

        if (finalCountdown === -1) {
          if (finalInterval) clearInterval(finalInterval);
          finalInterval = null;
          resumeQueue(playerName);
        }
      }, 1000);
    }
  }, 5000);
}

export function resumeQueue(playerName: string) {
  sendCommand(
    new DirectCommand(`tellraw ${playerName} "Unpausing... Have fun! :)"`)
  );
  setTimeout(() => {
    _resume(playerName);
  }, 1000);
}

export function _resume(playerName: string) {
  if (!paused) return;
  paused = false;

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (finalInterval) {
    clearInterval(finalInterval);
    finalInterval = null;
  }

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

  if (!processing && queue.length > 0) start();
}

export function getQueue() {
  return [...queue];
}
