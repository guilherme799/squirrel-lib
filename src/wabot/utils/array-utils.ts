declare global {
  interface Array<T> {
    any(predicate?: (item: T) => boolean): boolean;
  }
}

Array.prototype.any = function <T>(
  this: Array<T>,
  predicate?: (item: T) => boolean
): boolean {
  if (!predicate) {
    return this.length > 0;
  }

  return this.filter(predicate).length > 0;
};

export {};
