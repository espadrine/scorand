export class State {
  // size: in bits.
  constructor(size, bits = []) {
    this.bits = new Array(size);
    for (let i = 0; i < size; i++) {
      this.bits[i] = bits[i] || new ConstantBit(0);
    }
  }
}

// Information sources:
// Boolean Algebra: https://en.wikipedia.org/wiki/Boolean_algebra
// Logic gates: https://en.wikipedia.org/wiki/Logic_gate

class Bit {
  constructor() { this.type = this.constructor; }
  copy() { return new this.type(); }
  reduce() { return this.copy(); }
}

export class ConstantBit extends Bit {
  // bit: 0 or 1.
  constructor(bit) {
    super();
    this.set(bit);
  }
  set(bit) { this.value = (+bit)? 1: 0; return this; }
  copy() { return new this.type(this.value); }
  toString() { return String(this.value); }
}

export class VarBit extends Bit {
  constructor() {
    super();
    this.id = VarBit.varId++;
    this.name = VarBit.nameFromId(this.id);
  }
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
  reduce() {
    let b = super.reduce();
    b.operand = b.operand.reduce();
    // Double negation.
    if (b.operand.type === NotBit) { return b.operand.operand; }
    // Constant reduction.
    if (b.operand.type === ConstantBit) {
      if (b.value > 0) { return new ConstantBit(0); }
      else { return new ConstantBit(1); }
    }
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
  copy() { return new this.type(this.operands); }
  reduce() {
    let b = super.reduce();
    // Associativity.
    b.operands = b.operands.reduce((opds, o) => {
      if (o.type === this.type) {
        opds = opds.concat(o.operands);
      } else { opds.push(o); }
      return opds;
    }, []);
    return b;
  }
}

class AssocCommOpBit extends AssocOpBit {
  constructor(operands) { super(operands); }
  reduce() {
    let b = super.reduce();
    b.operands = b.operands.map(o => o.reduce());
    return b;
  }
  sort() {
    // Order the operands.
    this.operands = this.operands.sort((a, b) =>
      a.toString() > b.toString()? 1: -1);
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

  // Zero identity; One conversion.
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
    b = b.reduceDup().sort().reduceConst();
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

  reduceDistributivity() {
    // TODO
    let b = this.copy();

    if (b.operands.length === 1) {
      b = b.operands[0];
    }
    return b;
  }

  reduce() {
    // We put the annihilator early to avoid unnecessary computation.
    // Only the last reduction (after the sort) can yield a non-OR.
    return super.reduce().reduceAnnihilator().reduceIdentity()
      .reduceIdempotence().reduceAbsorption().sort().reduceDistributivity();

  }
}

export class AndBit extends AssocCommOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('∧') + ')';
  }
}
