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

// The basics: ARX.

class AssocOpBit extends Bit {
  constructor(operands) {
    super();
    // Since it is associative, we present all operands as a list.
    this.operands = operands.slice();
  }
  copy() { return new this.type(this.operands); }
}

class AssocCommOpBit extends AssocOpBit {
  constructor(operands) { super(operands); }
  reduce() {
    let b = super.reduce();
    b.operands = b.operands.map(o => o.reduce());
    // Order the operands.
    b.operands = b.operands.sort((a, b) =>
      a.toString() > b.toString()? 1: -1);
    return b;
  }
}

export class XorBit extends AssocCommOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('⊕') + ')';
  }

  // A ⊕ A = 0.
  reduceDup() {
    let b = super.reduce();
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

  // A ⊕ ¬A = 1
  reduceOpposites() {
    let b = super.reduce();
    let pos = b.operands.reduce((s, o) => s.add(o.toString()), new Set());
    let neg = b.operands.reduce((s, o) => (o.type !== NotBit)? s:
      s.add(o.operand.toString()), new Set());
    let count = b.operands.filter(o => neg.has(o.toString())).length;
    // Remove operands that are compensated by their opposite.
    b.operands = b.operands.filter(o => !(
      // Positive that has a negative.
      neg.has(o.toString()) ||
      // Negative that has a positive.
      ((o.type === NotBit) && pos.has(o.operand.toString()))));
    // Add the one.
    if (count % 2 === 1) { b.operands.push(new ConstantBit(1)); }
    return b;
  }

  reduceConst() {
    let b = super.reduce();
    // Remove zeroes.
    b.operands = b.operands.filter(o =>
      !(o.type === ConstantBit && o.value === 0));
    // TODO: compute xors with 1.
    if (b.operands.length === 0) {
      return new ConstantBit(0);
    } else if (b.operands.length === 1) {
      return b.operands[0];
    }
    return b;
  }
  reduce() {
    return this.reduceDup().reduceOpposites().reduceConst();
  }
}

export class OrBit extends AssocOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('∨') + ')';
  }
}

export class AndBit extends AssocOpBit {
  constructor(operands) { super(operands); }
  toString() {
    return '(' + this.operands.map(o => o.toString()).join('∧') + ')';
  }
}

export class NotBit extends Bit {
  constructor(expr) {
    super();
    this.operand = expr;
  }
  copy() { return new this.type(this.operand); }
  toString() { return '¬' + this.operand.toString(); }
}
