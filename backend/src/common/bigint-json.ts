// Prisma returns BigInt for money fields; Express JSON responses fail without this.
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function toJSON() {
  return this.toString();
};

export {};
