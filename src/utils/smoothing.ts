export class SmoothFilter {
  private value: number;
  constructor(
    private alpha: number,
    initial: number = 0.5
  ) {
    this.value = initial;
  }
  update(raw: number): number {
    this.value = this.alpha * raw + (1 - this.alpha) * this.value;
    return this.value;
  }
  reset(v: number = 0.5): void {
    this.value = v;
  }
  getValue(): number {
    return this.value;
  }
}
