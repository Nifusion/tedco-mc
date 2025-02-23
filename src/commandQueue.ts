import { DirectCommand } from "./directCommand";
import { ICommand } from "./ICommand";
import ServerManager from "./serverManager";
import { SummonEntityCommand } from "./summonEntityCommand";

interface PlayerCommandQueue {
  queue: ICommand[];
  processing: boolean;
  paused: boolean;
  intervalId: NodeJS.Timeout | null;
  countdownInterval: NodeJS.Timeout | null;
  finalInterval: NodeJS.Timeout | null;
}

let playerQueues: Map<string, PlayerCommandQueue> = new Map();

function getPlayerQueue(playerName: string) {
  if (!playerQueues.has(playerName)) {
    playerQueues.set(playerName, {
      queue: [],
      processing: false,
      paused: false,
      intervalId: null,
      countdownInterval: null,
      finalInterval: null,
    });
  }
  return playerQueues.get(playerName)!;
}

export function addCommand(playerName: string, command: ICommand) {
  const playerQueue = getPlayerQueue(playerName);
  playerQueue.queue.push(command);
  if (!playerQueue.processing) start(playerName);
}

export function start(playerName: string) {
  const playerQueue = getPlayerQueue(playerName);
  if (playerQueue.processing || playerQueue.paused) return;
  playerQueue.processing = true;

  playerQueue.intervalId = setInterval(() => {
    if (playerQueue.queue.length > 0) {
      const command = playerQueue.queue.shift();
      if (command)
        try {
          ServerManager.getInstance().sendCommand(command);
          if (command instanceof SummonEntityCommand) {
            const sec = command as SummonEntityCommand;
            if (sec.secondary)
              setTimeout(() => {
                if (sec.secondary)
                  ServerManager.getInstance().sendCommand(sec.secondary);
              }, 100);
          }
        } catch (error) {
          console.error("Error processing command:", command, error);
        }
    } else {
      stop(playerName);
    }
  }, 10);
}

export function stop(playerName: string) {
  const playerQueue = getPlayerQueue(playerName);
  if (playerQueue.intervalId) {
    clearInterval(playerQueue.intervalId);
    playerQueue.intervalId = null;
  }
  playerQueue.processing = false;
}

export function pauseQueue(playerName: string) {
  const playerQueue = getPlayerQueue(playerName);
  if (playerQueue.paused) return;
  playerQueue.paused = true;

  let timeLeft = 30;

  ServerManager.getInstance().sendCommand(
    new DirectCommand(`tellraw ${playerName} "Pausing for 30 seconds..."`)
  );

  playerQueue.countdownInterval = setInterval(() => {
    timeLeft -= 5;
    if (timeLeft > 5) {
      ServerManager.getInstance().sendCommand(
        new DirectCommand(
          `tellraw ${playerName} "Unpausing in ${timeLeft} seconds... (Queued: ${playerQueue.queue.length})"`
        )
      );
    } else {
      if (playerQueue.countdownInterval)
        clearInterval(playerQueue.countdownInterval);
      playerQueue.countdownInterval = null;

      let finalCountdown = 5;
      playerQueue.finalInterval = setInterval(() => {
        ServerManager.getInstance().sendCommand(
          new DirectCommand(
            `tellraw ${playerName} "${finalCountdown}... (Queued: ${playerQueue.queue.length})"`
          )
        );
        finalCountdown--;

        if (finalCountdown === -1) {
          if (playerQueue.finalInterval)
            clearInterval(playerQueue.finalInterval);
          playerQueue.finalInterval = null;
          resumeQueue(playerName);
        }
      }, 1000);
    }
  }, 5000);
}

export function resumeQueue(playerName: string) {
  const playerQueue = getPlayerQueue(playerName);
  if (!playerQueue.paused) return;
  ServerManager.getInstance().sendCommand(
    new DirectCommand(`tellraw ${playerName} "Unpausing... Have fun! :)"`)
  );
  setTimeout(() => {
    _resume(playerName);
  }, 1000);
}

export function _resume(playerName: string) {
  const playerQueue = getPlayerQueue(playerName);
  if (!playerQueue.paused) return;
  playerQueue.paused = false;

  if (playerQueue.countdownInterval) {
    clearInterval(playerQueue.countdownInterval);
    playerQueue.countdownInterval = null;
  }
  if (playerQueue.finalInterval) {
    clearInterval(playerQueue.finalInterval);
    playerQueue.finalInterval = null;
  }

  ServerManager.getInstance().sendCommand(
    new DirectCommand(
      `execute as @e[tag=serverSpawned,tag=${playerName}] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
    )
  );

  ServerManager.getInstance().sendCommand(
    new DirectCommand(
      `execute as @e[type=minecraft:vex] at ${playerName} run data merge entity @s {NoAI:0, Silent:0, Invulnerable:0}`
    )
  );

  if (!playerQueue.processing && playerQueue.queue.length > 0)
    start(playerName);
}

export function getQueue(playerName: string) {
  const playerQueue = getPlayerQueue(playerName);
  return [...playerQueue.queue];
}
