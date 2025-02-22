export function randomNumber(low: number, high: number) {
  return Math.floor(Math.random() * high) + low;
}

export function randomNumberNoFloor(low: number, high: number): number {
  const randomValue = Math.random() * (high - low) + low;
  return Math.round(randomValue * 100) / 100;
}
