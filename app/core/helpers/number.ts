export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(min, value), max)
}

export const clampBetween = (min: number, max: number) => (value: number) => clamp(value, min, max)

export function sum(values: number[]) {
  return values.reduce((acc, curr) => acc + curr, 0)
}
