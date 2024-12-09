// Fix BigInt serialization: https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-953187833
// Import this file and call fixBigIntSerialization() to fix BigInt serialization

declare global {
  interface BigInt {
    toJSON: () => string;
  }
}

export function fixBigIntSerialization(): void {
  if (!BigInt.prototype.toJSON) {
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
  }
}
