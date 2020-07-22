export class Buffer {
  // size: in bits.
  constructor(size, bits = []) {
    this.bits = new Array(size);
    for (let i = 0; i < size; i++) {
      this.bits[i] = bits[i] || new VarBit();
    }
  }
  static from(bits) { return new Buffer(bits.length, bits); }

  not() {
    const r = this.copy();
    r.bits = r.bits.map(b => new NotBit(b));
    return r;
  }
  bitwiseOp(buf0, op) {
    buf0 = buf0.copy();
    const buf1 = this.copy();
    const buf0len = buf0.bits.length, buf1len = buf1.bits.length;
    let longer, shorter;
    if (buf0len > buf1len) { longer = buf0; shorter = buf1; }
    else                   { longer = buf1; shorter = buf0; }
    longer.bits = longer.bits.map((b, i) =>
      (shorter.bitAt(i) === undefined)? b:
      new op([b, shorter.bitAt(i)]));
    return longer;
  }
  xor(buf) { return this.bitwiseOp(buf, XorBit); }
  or(buf) { return this.bitwiseOp(buf, OrBit); }
  and(buf) { return this.bitwiseOp(buf, AndBit); }
  shiftRight(count) {
    if (count < 0) { return this.shiftLeft(-count); }
    const zeroes = Math.min(count, this.bits.length);
    return this.constructor.from(
      [...new Array(zeroes)].map(e => new ConstantBit(0))
      .concat(this.bits.slice(0, this.bits.length - zeroes)));
  }
  shiftLeft(count) {
    if (count < 0) { return this.shiftRight(-count); }
    const zeroes = Math.min(count, this.bits.length);
    return this.constructor.from(
      this.bits.slice(zeroes).concat(
      [...new Array(zeroes)].map(e => new ConstantBit(0))));
  }
  rotateRight(count) {
    if (count < 0) { return this.rotateLeft(-count); }
    const offset = this.bits.length - (count % this.bits.length);
    return this.constructor.from(
      this.bits.slice(offset).concat(this.bits.slice(0, offset)));
  }
  rotateLeft(count) {
    if (count < 0) { return this.rotateRight(-count); }
    const offset = count % this.bits.length;
    return this.constructor.from(
      this.bits.slice(offset).concat(this.bits.slice(0, offset)));
  }

  // Number between 0 and 1 of likelihood that the bit is set.
  probabilityOfBitAt(idx) {
    return this.bits[idx].probability();
  }

  reduce() {
    for (let i = this.bits.length - 1; i >= 0; i--) {
      this.setBitAt(i, this.bitAt(i).reduce());
    }
    return this;
  }

  size() { return this.bits.length; }
  bitAt(pos) { return this.bits[pos]; }
  setBitAt(pos, bit) { return this.bits[pos] = bit; }
  copy() { return new this.constructor(this.bits.length, this.bits); }
  slice(a, b) {
    if (a === undefined) { a = 0; }
    if (b === undefined) {
      if (a < 0) { a += this.bits.length; }
      b = this.bits.length;
    }
    return new this.constructor(b - a, this.bits.slice(a, b));
  }
  toString() {
    return '[' + this.bits.join(', ') + ']';
  }
}

// Integers.

export class UInt extends Buffer {
  constructor(int) { super(0); this.set(int); }
  static from(bits) {
    const r = new UInt(0);
    r.bits = bits;
    return r;
  }

  // UInt with bit variables of a size in bits.
  static ofSize(size) {
    const bits = new Array(size);
    for (let i = 0; i < size; i++) {
      bits[i] = new VarBit();
    }
    return UInt.from(bits);
  }

  // Change the bits of the UInt to lay out another integer.
  set(int) {
    this.bits = UInt.bitsFromInteger(int);
    return this;
  }

  // Addition. We grow the buffer to fit.
  plus(int) {
    const bits = [];
    let carry = new ConstantBit(0);
    const longest = this.bits.length > int.bits.length? this: int;
    const shortest = this.bits.length > int.bits.length? int: this;
    let a, b;
    for (let i = 0; i <= longest.bits.length; i++) {
      a = longest.bitAt(longest.bits.length - i - 1) || new ConstantBit(0);
      b = shortest.bitAt(shortest.bits.length - i - 1) || new ConstantBit(0);
      bits.push(new XorBit([a.copy(), b.copy(), carry]));
      carry = UInt.carry(a.copy(), b.copy(), carry);
    }
    return UInt.from(bits.reverse());
  }

  // Multiplication. We grow the buffer to fit.
  times(int) {
    // Implementation: multiplicative distribution.
    //        a   b   c  ← this
    //     ×      d   e  ← int
    //     -------------
    //       a∧e b∧e c∧e
    // + a∧d b∧d c∧d
    let acc = new this.constructor(0);
    for (let i = 0; i < int.bits.length; i++) {
      const intBit = int.bits[i].copy();
      if (intBit.type === ConstantBit && intBit.value === 0) { continue; }
      const partial = this.times2exp(int.bits.length - i - 1);
      partial.bits = partial.bits.map(b => new AndBit([intBit, b.copy()]));
      acc = acc.plus(partial);
      // Tiny break in our no-automatic-reduce rule, to limit slowdown.
      acc.reduce();
    }
    return acc;
  }

  // Multiplication by 2^n.
  // This is similar to a Buffer shiftLeft(), but unbounded.
  times2exp(n) {
    if (n < 0) { return this.dividedBy2exp(-n); }
    const r = this.copy();
    r.bits = r.bits.concat([...new Array(n)].map(e => new ConstantBit(0)));
    return r;
  }

  // Take an integer (Number), return the list of Bits
  // encoding it, most significant bit first.
  // eg. 2 → [1, 0].
  static bitsFromInteger(int) {
    int = BigInt(int);
    const bits = [];
    for (; int > 0n; int >>= 1n) {
      bits.push(new ConstantBit(+!!(int & 1n)));
    }
    return bits.reverse();
  }

  // Take two bits with same significance in both numbers,
  // compute the carry for the the bit with more significance.
  // ie. xxxayy + xxxbyy, with yy yielding a carry of prevCarry,
  // a being prevA, and b being prevB.
  static carry(prevA, prevB, prevCarry) {
    return new OrBit([new AndBit([prevA, prevB]),
      new AndBit([new XorBit([prevA, prevB]), prevCarry])]);
  }

  copy() {
    const r = new this.constructor(0);
    r.bits = this.bits.map(b => b.copy());
    return r;
  }
}

export class UIntWithOverflow extends UInt {
  constructor(int, size) {
    super(int);
    this.overflowSize = size;
    this.truncateMostSignificant();
  }
  static from(bits) {
    const r = new UIntWithOverflow(0, bits.length);
    r.bits = bits;
    return r;
  }
  static ofSize(size) {
    return UIntWithOverflow.from(UInt.ofSize(size).bits);
  }

  set(int) {
    return super.set(int).truncateMostSignificant();
  }
  // Return this+int.
  plus(int) {
    const r = this.copy();
    r.bits = super.plus(int).bits;
    return r.truncateMostSignificant();
  }
  // Return -this, underflowing.
  negative() { return this.not().plus(new this.constructor(1)); }
  // Return this-int. int must be a UIntWithOverflow.
  minus(int) {
    return this.plus(this.constructor.from(int.bits).negative());
  }
  // Return this*int.
  times(int) {
    // FIXME: we could optimize this through Kochanski multiplication.
    const r = this.copy();
    r.bits = super.times(int).bits;
    return r.truncateMostSignificant();
  }

  // If the int does not fit the UInt’s bit length,
  // we trunate the most significant bits.
  truncateMostSignificant() {
    if (this.overflowSize > this.bits.length) {
      // Fill zeroes at the start to fit size.
      const zeroes = this.overflowSize - this.bits.length;
      this.bits = [...new Array(zeroes)].map(e => new ConstantBit(0))
        .concat(this.bits);
    } else {
      // Remove most significant bits that go past the size.
      this.bits = this.bits.slice(this.bits.length - this.overflowSize);
    }
    return this;
  }

  copy() {
    const r = super.copy();
    r.overflowSize = this.overflowSize;
    return r;
  }
}

// Byte.
export class UInt8 extends UIntWithOverflow {
  constructor(int) { super(int, 8); }
  static from(bits) {
    const r = new UInt8(0, bits.length);
    r.bits = bits;
    r.truncateMostSignificant();
    return r;
  }
  static variable() { return UInt8.from(UInt.ofSize(8).bits); }
}

// Word.
export class UInt16 extends UIntWithOverflow {
  constructor(int) { super(int, 16); }
  static from(bits) {
    const r = new UInt16(0, bits.length);
    r.bits = bits;
    r.truncateMostSignificant();
    return r;
  }
  static variable() { return UInt16.from(UInt.ofSize(16).bits); }
}

// Doubleword.
export class UInt32 extends UIntWithOverflow {
  constructor(int) { super(int, 32); }
  static from(bits) {
    const r = new UInt32(0, bits.length);
    r.bits = bits;
    r.truncateMostSignificant();
    return r;
  }
  static variable() { return UInt32.from(UInt.ofSize(32).bits); }
}

// Quadword.
export class UInt64 extends UIntWithOverflow {
  constructor(int) { super(int, 64); }
  static from(bits) {
    const r = new UInt64(0, bits.length);
    r.bits = bits;
    r.truncateMostSignificant();
    return r;
  }
  static variable() { return UInt64.from(UInt.ofSize(64).bits); }
}

// Sometimes available through compilers.
export class UInt128 extends UIntWithOverflow {
  constructor(int) { super(int, 128); }
  static from(bits) {
    const r = new UInt128(0, bits.length);
    r.bits = bits;
    r.truncateMostSignificant();
    return r;
  }
  static variable() { return UInt128.from(UInt.ofSize(128).bits); }
}

// There are no 256-bit CPUs yet,
// but this could be used to implement SIMD operations.
export class UInt256 extends UIntWithOverflow {
  constructor(int) { super(int, 256); }
  static from(bits) {
    const r = new UInt256(0, bits.length);
    r.bits = bits;
    r.truncateMostSignificant();
    return r;
  }
  static variable() { return UInt256.from(UInt.ofSize(256).bits); }
}

// Booleans.

// Information sources:
// Boolean Algebra: https://en.wikipedia.org/wiki/Boolean_algebra
// Logic gates: https://en.wikipedia.org/wiki/Logic_gate

class Bit {
  constructor() { this.type = this.constructor; }
  copy() { return new this.type(); }
  reduce() { return this.copy(); }
  // probability() returns a number between 0 and 1 giving
  // the likelihood of the bit being set,
  // assuming each variable is independent and randomly set.
  //
  // probabilityGiven(env) returns a number between 0 and 1 giving
  // the likelihood of the bit being set,
  // assuming as above, except for variables in env.
  // Env is a Map from string variables to a probability of being set.
  //
  // FIXME: perhaps using variable IDs instead of string variables is faster.
  probability() { return this.probabilityGiven(new Map()); }
}

export class ConstantBit extends Bit {
  // bit: 0 or 1.
  constructor(bit) {
    super();
    this.set(bit);
  }
  set(bit) { this.value = (+bit)? 1: 0; return this; }
  probabilityGiven(env) { return this.value; }
  variables() { return new Set(); }
  copy() { return new this.type(this.value); }
  toString() { return String(this.value); }
}

export class VarBit extends Bit {
  constructor() {
    super();
    this.id = VarBit.varId++;
    this.name = VarBit.nameFromId(this.id);
  }

  probabilityGiven(env) {
    if (env.has(this.name)) {
      return env.get(this.name);
    }
    return 0.5;
  }
  variables() { return new Set([this.name]); }

  copy() {
    let b = new this.type();
    b.id = this.id;
    b.name = this.name;
    return b;
  }
  toString() { return this.name; }
}
VarBit.varId = 0;
VarBit.nameFromId = function(id) {
  let s = String.fromCharCode(97 + (id % 26));
  for (let r = (id / 26) >>> 0; r > 0; r = ((r-1) / 26) >>> 0) {
    s = String.fromCharCode(97 + ((r-1) % 26)) + s;
  }
  return s;
};

export class NotBit extends Bit {
  constructor(expr) {
    super();
    this.operand = expr;
  }
  copy() { return new this.type(this.operand); }
  probabilityGiven(env) { return 1 - this.operand.probabilityGiven(env); }
  variables() { return this.operand.variables(); }

  // De Morgan 1: ¬(A ∨ B) = ¬A ∧ ¬B
  reduceDeMorgan1() {
    const b = this.copy();
    if (b.operand.type === OrBit) {
      return new AndBit(b.operand.operands.map(op =>
        new NotBit(op).reduce()));
    }
    return b;
  }

  // De Morgan 2: ¬(A ∧ B) = ¬A ∨ ¬B
  reduceDeMorgan2() {
    const b = this.copy();
    if (b.operand.type === AndBit) {
      return new OrBit(b.operand.operands.map(op =>
        new NotBit(op).reduce()));
    }
    return b;
  }

  reduce() {
    let b = super.reduce();
    b.operand = b.operand.reduce();
    // Constant reduction.
    if (b.operand.type === ConstantBit) {
      if (b.operand.value > 0) { return new ConstantBit(0); }
      else { return new ConstantBit(1); }
    }
    // Double negation: ¬¬A = A.
    if (b.operand.type === NotBit) { return b.operand.operand; }
    // De Morgan.
    b = b.reduceDeMorgan1();
    if (b.type !== NotBit) { return b; }
    b = b.reduceDeMorgan2();
    return b;
  }
  toString() { return '¬' + this.operand.toString(); }
}

// The basics: ARX.

class AssocOpBit extends Bit {
  constructor(operands) {
    if (!(operands instanceof Array)) {
      throw TypeError('Invalid non-array operand for AssocOpBit:' +
        operands);
    }
    super();
    // Since it is associative, we present all operands as a list.
    this.operands = operands.slice();
  }

  probabilityGiven(env) {
    if (this.operands.length === 0) { return 0; }
    const a = this.operands[0];
    if (this.operands.length === 1) { return a.probabilityGiven(env); }
    // FIXME: we could avoid the recursivity and gain a bit of speed.
    const b = this.copy();
    b.operands = b.operands.slice(1);
    const aVars = a.variables(), bVars = b.variables();
    const codependentVars = [...intersection(aVars, bVars)];

    // Given each possible configuration of codependent variables,
    // we want the probability of a,
    // and the probability of b.
    // Those events are independent,
    // since there are no codependent variables:
    // those are all set to either 0 or 1, thus no longer variable.
    // Therefore we can get an exact computation of Pr(a•b) from that.
    //
    // FIXME: when the number of configurations is too large,
    // perform Monte-Carlo approximation.
    // The exponential explosion is why SAT is NP-complete.
    const codepSize = codependentVars.length;
    const codepConfNum = 2 ** codepSize;
    // We compute:
    // Pr(A•B) = Pr(((A•B) ∧ codepConf1) ∨ ((A•B) ∧ codepConf2) ∨ …)
    //         = Σᵢ Pr((A•B) ∧ codepConfᵢ)
    //         = Σᵢ Pr((A•B) | codepConfᵢ) × Pr(codepConfᵢ)
    let prob = 0;
    const truthTable = this.truthTable();
    // First, we loop through all configurations.
    for (let i = 0; i < codepConfNum; i++) {
      // eg: i = 5
      // FIXME: we can get rid of string operations for performance.
      const confBits = i.toString(2).padStart(codepSize, '0') // 0101
        .split('').map(d => +d);  // [0, 1, 0, 1]
      const conf = mapUnion(env,
        new Map(codependentVars.map((v, i) => [v, confBits[i]])));
      // Now, we compute Pr((A•B) | codepConfᵢ).
      // Generally, given the truth table T for A•B, eg.:
      //
      //     i │ T[A] │ T[B] │ T[A⊕B]
      //     ──┼──────┼──────┼───────
      //     0 │   0  │   0  │    0
      //     1 │   0  │   1  │    1
      //     2 │   1  │   0  │    1
      //     3 │   1  │   1  │    0
      //
      // Then we have, assuming A and B are independent:
      // Pr(A•B) = Σᵢ T[A•B]ᵢ × Pr(A=T[A]ᵢ) × Pr(B=T[B]ᵢ).
      // In our case, A and B are independent,
      // since all their common variables are configured, thus constant.
      const pa = a.probabilityGiven(conf);
      const pb = b.probabilityGiven(conf);
      prob +=
          ((truthTable[0] === 1)? ((1-pa) * (1-pb)): 0)
       +  ((truthTable[1] === 1)? ((1-pa) *    pb ): 0)
       +  ((truthTable[2] === 1)? (   pa  * (1-pb)): 0)
       +  ((truthTable[3] === 1)? (   pa  *    pb ): 0);
    }
    // Finally, Pr(codepConfᵢ) is just 1÷codepConfNum.
    // FIXME: improve precision with BigInt for when codepConfNum is too big.
    prob /= codepConfNum;
    return prob;
  }

  // Return a Set of string variables.
  // FIXME: we may gain efficiency by using variable IDs instead.
  variables() {
    return this.operands.reduce((acc, o) => union(acc, o.variables()),
      new Set());
  }

  // The static truthTable is an array of the form [0, 1, 1, 0],
  // where the first element is the result of appying 0•0,
  // the second is 0•1, the third 1•0, and the last 1•1,
  // where • is the associative operation.
  truthTable() {
    if (this.constructor.cachedTruthTable !== undefined) {
      return this.constructor.cachedTruthTable;
    };
    const zero = new ConstantBit(0), one = new ConstantBit(1);
    const table = [
      new this.constructor([zero, zero]).reduce().value,
      new this.constructor([zero,  one]).reduce().value,
      new this.constructor([ one, zero]).reduce().value,
      new this.constructor([ one,  one]).reduce().value,
    ];
    if (table.every(v => v !== undefined)) {
      this.constructor.cachedTruthTable = table;
      return table;
    } else { return []; }
  }

  copy() { return new this.type(this.operands); }
  // Associativity: A • (B • C) = (A • B) • C
  reduceAssociative() {
    let b = this.copy();
    b.operands = b.operands.reduce((opds, o) => {
      o = o.reduce();
      if (o.type === this.type) {
        opds = opds.concat(o.operands);
      } else { opds.push(o); }
      return opds;
    }, []);
    return b;
  }
  reduce() { return super.reduce().reduceAssociative(); }
}

// Return the union of two Sets (which is also a Set).
// FIXME: gain a bit of speed by avoiding Array creation.
function union(set1, set2) {
  return new Set([...set1, ...set2]);
}
// Return the intersection of two Sets (which is also a Set).
function intersection(set1, set2) {
  const s = new Set();
  for (let v of set1) {
    if (set2.has(v)) {
      s.add(v);
    }
  }
  return s;
}
// Return the union of two Maps (which is also a Map).
// FIXME: gain a bit of speed by avoiding Array creation.
function mapUnion(map1, map2) {
  return new Map([...map1, ...map2]);
}

class AssocCommOpBit extends AssocOpBit {
  constructor(operands) { super(operands); }
  reduce() { return super.reduce().sort(); }
  sort() {
    // Order the operands.
    this.operands.sort((a, b) => a.toString() > b.toString()? 1: -1);
    return this;
  }
}

export class XorBit extends AssocCommOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('⊕') + ')';
  }

  // Positive annihilation: A ⊕ A = 0.
  // Note that negative annihilation (A ⊕ ¬A = 1) is also taken care of, because
  // NOT factorization is performed first.
  reduceDup() {
    let b = this.copy();
    // Count operands with the same representation.
    let dups = b.operands.reduce((m, o) => {
      let str = o.toString();
      let c = m.get(str);
      if (!c) { c = 0; m.set(str, c); }
      m.set(str, c + 1);
      return m;
    }, new Map());

    let opds = [], treated = new Map();
    for (let i = b.operands.length - 1; i >= 0; i--) {
      let op = b.operands[i], str = op.toString();
      if (treated.has(str)) { continue; }
      let c = dups.get(str);
      if (c % 2 === 1) { // One remains.
        opds.push(op);
      } else {} // They all cancel out.
      treated.set(str, true);
    }
    b.operands = opds;
    return b;
  }

  // Zero identity; One negation.
  reduceConst() {
    let b = this.copy();
    // Ones annihilate pairwise. The last one is equivalent to a NOT.
    let ones = b.operands.filter(o =>
      (o.type === ConstantBit) && o.value === 1).length;
    // Remove zeroes (always true),
    // and ones (only the odd one matters, by being converted to a NOT.)
    b.operands = b.operands.filter(o => o.type !== ConstantBit);

    if (b.operands.length === 0) {
      b = new ConstantBit(0);
    } else if (b.operands.length === 1) {
      b = b.operands[0];
    }

    if (ones % 2 === 1) { return new NotBit(b).reduce(); }
    return b;
  }

  reduce() {
    let b = super.reduce();
    // Not factorization: (¬A ⊕ B) = ¬(A ⊕ B).
    // We must do it before doing positive annihilation (reduceDup), but it can
    // change the bit to a NotBit, so we only set b after all reductions.
    let negCount = b.operands.reduce((count, o) =>
      o.type === NotBit? count + 1: count, 0);
    b.operands = b.operands.map(o => o.type === NotBit? o.operand: o);
    // The Not factorization can yield associable terms.
    // So we perform associative reduction again.
    b = b.reduceAssociative().reduceDup().sort().reduceConst();
    // The NOTs cancel pairwise; if there is one remaining, it becomes this bit.
    if (negCount % 2 === 1) { b = new NotBit(b).reduce(); }
    return b;
  }
}

export class OrBit extends AssocCommOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('∨') + ')';
  }

  // Annihilator: A ∨ 1 = 1
  reduceAnnihilator() {
    let b = this.copy();
    if (b.operands.some(o => o.type === ConstantBit && o.value === 1)) {
      b.operands = [new ConstantBit(1)];
    }
    return b;
  }

  // Complementation: A ∨ ¬A = 1
  reduceComplementation() {
    let b = this.copy();
    let nots = b.operands.reduce((m, o) =>
      (o.type === NotBit)? m.add(o.operand.toString()): m,
      new Set());
    if (b.operands.some(o => nots.has(o.toString()))) {
      b.operands = [new ConstantBit(1)];
    }
    return b;
  }

  // Identity: A ∨ 0 = A
  reduceIdentity() {
    let b = this.copy();
    b.operands = b.operands.filter(o =>
      !(o.type === ConstantBit && o.value === 0));
    return b;
  }

  // Idempotency: A ∨ A = A
  reduceIdempotence() {
    let b = this.copy();
    let reprs = new Set();
    b.operands = b.operands.reduce((ops, o) => {
      let repr = o.toString();
      if (!reprs.has(repr)) {
        reprs.add(repr);
        ops.push(o);
      }
      return ops;
    }, []);
    return b;
  }

  // Absorption: A ∨ (A ∧ B) = A
  reduceAbsorption() {
    let b = this.copy();
    let reprs = b.operands.reduce((reprs, o) =>
      reprs.add(o.toString()), new Set());
    b.operands = b.operands.filter(o => !(o.type === AndBit &&
      o.operands.some(oo => reprs.has(oo.toString()))));
    return b;
  }

  // Distributivity: (A∧B) ∨ (A∧C) = A ∧ (B∨C)
  // Note: since DNF is easier to solve SAT for,
  // do we really want to perform this reduction?
  reduceDistributivity() {
    let b = this.copy();
    // If the OR has more than 2 operands, we probably won’t gain much.
    // For instance, (A∧B) ∨ (A∧C) ∨ D ∨ E = (A∨D∨E) ∧ (B∨C∨D∨E),
    // which goes from 5 operations to 6, complexifying the expression.
    if (b.operands.length !== 2 ||
      b.operands.some(o => o.type !== AndBit || o.operands.length !== 2)) {
      return b;
    }

    // Find a common operand among the AND operands.
    const b0 = b.operands[0], b1 = b.operands[1];
    let pivot = b0.operands.find(o1 =>
      b1.operands.some(o2 => o1.toString() === o2.toString()));
    if (pivot !== undefined) {
      b = new AndBit([pivot.copy(), new OrBit(
        b0.operands.filter(o => o.toString() !== pivot.toString()).concat(
        b1.operands.filter(o => o.toString() !== pivot.toString()))
      )]);
    }
    return b;
  }

  reduce() {
    // We put the annihilators early to avoid unnecessary computation.
    // Only the last reduction (after the sort) can yield a non-OR.
    let b = super.reduce().reduceAnnihilator().reduceComplementation()
      .reduceIdentity().reduceIdempotence().reduceAbsorption()
      .sort().reduceDistributivity();
    if (b.operands) {
      if (b.operands.length === 0) {
        b = new ConstantBit(0);
      } else if (b.operands.length === 1) {
        b = b.operands[0];
      }
    }
    return b;
  }
}

export class AndBit extends AssocCommOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('∧') + ')';
  }

  // Annihilator: A ∧ 0 = 0
  reduceAnnihilator() {
    let b = this.copy();
    if (b.operands.some(o => o.type === ConstantBit && o.value === 0)) {
      b.operands = [new ConstantBit(0)];
    }
    return b;
  }

  // Complementation: A ∧ ¬A = 0
  reduceComplementation() {
    let b = this.copy();
    let nots = b.operands.reduce((m, o) =>
      (o.type === NotBit)? m.add(o.operand.toString()): m,
      new Set());
    if (b.operands.some(o => nots.has(o.toString()))) {
      b.operands = [new ConstantBit(0)];
    }
    return b;
  }

  // Identity: A ∧ 1 = A
  reduceIdentity() {
    let b = this.copy();
    b.operands = b.operands.filter(o =>
      !(o.type === ConstantBit && o.value === 1));
    return b;
  }

  // Idempotency: A ∧ A = A
  reduceIdempotence() {
    let b = this.copy();
    let reprs = new Set();
    b.operands = b.operands.reduce((ops, o) => {
      let repr = o.toString();
      if (!reprs.has(repr)) {
        reprs.add(repr);
        ops.push(o);
      }
      return ops;
    }, []);
    return b;
  }

  // Absorption: A ∧ (A ∨ B) = A
  reduceAbsorption() {
    let b = this.copy();
    let reprs = b.operands.reduce((reprs, o) =>
      reprs.add(o.toString()), new Set());
    b.operands = b.operands.filter(o => !(o.type === OrBit &&
      o.operands.some(oo => reprs.has(oo.toString()))));
    return b;
  }

  // Distributivity: (A∨B) ∧ (A∨C) = A ∨ (B∧C)
  reduceDistributivity() {
    let b = this.copy();
    // If the AND has more than 2 operands, we probably won’t gain much.
    // For instance, (A∨B) ∧ (A∨C) ∧ D ∧ E = (A∧D∧E) ∨ (B∧C∧D∧E),
    // which goes from 5 operations to 6, complexifying the expression.
    if (b.operands.length !== 2 ||
      b.operands.some(o => o.type !== OrBit || o.operands.length !== 2)) {
      return b;
    }

    // Find a common operand among the AND operands.
    const b0 = b.operands[0], b1 = b.operands[1];
    let pivot = b0.operands.find(o1 =>
      b1.operands.some(o2 => o1.toString() === o2.toString()));
    if (pivot !== undefined) {
      b = new OrBit([pivot.copy(), new AndBit(
        b0.operands.filter(o => o.toString() !== pivot.toString()).concat(
        b1.operands.filter(o => o.toString() !== pivot.toString()))
      )]);
    }
    return b;
  }

  reduce() {
    // We put the annihilators early to avoid unnecessary computation.
    // Only the last reduction (after the sort) can yield a non-AND.
    let b = super.reduce().reduceAnnihilator().reduceComplementation()
      .reduceIdentity().reduceIdempotence().reduceAbsorption()
      .sort().reduceDistributivity();
    if (b.operands) {
      if (b.operands.length === 0) {
        b = new ConstantBit(1);
      } else if (b.operands.length === 1) {
        b = b.operands[0];
      }
    }
    return b;
  }
}
