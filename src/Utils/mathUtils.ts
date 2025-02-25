export function randomNumber(low: number, high: number) {
  return Math.floor(Math.random() * high) + low;
}

export function randomNumberNoFloorExclusionZoneWithExclusion(
  low: number,
  high: number,
  excludeLow: number,
  excludeHigh: number
): number {
  let randomValue = randomNumberNoFloor(low, high);

  if (randomValue >= excludeLow && randomValue <= excludeHigh) {
    if (randomValue < excludeLow) {
      randomValue = excludeLow;
    } else if (randomValue > excludeHigh) {
      randomValue = excludeHigh;
    }
  }

  return randomValue;
}

export function randomNumberNoFloor(low: number, high: number): number {
  const randomValue = Math.random() * (high - low) + low;
  return Math.round(randomValue * 100) / 100;
}

export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
