import {strict as assert} from 'assert';
import {Buffer, ConstantBit, VarBit, NotBit, XorBit, AndBit, OrBit}
from '../algebraic.js';

// ConstantBit
assert.equal(new ConstantBit(0).value, 0);
assert.equal(new ConstantBit(1).value, 1);
assert.equal(new ConstantBit(0).set(1).value, 1);
assert.equal(new ConstantBit(1).set(0).value, 0);
assert.equal(String(new ConstantBit(1)), '1');

// VarBit
assert.equal(new VarBit().toString(), 'a');
assert.equal(new VarBit().toString(), 'b');
VarBit.varId = 25;
assert.equal(new VarBit().toString(), 'z');
assert.equal(new VarBit().toString(), 'aa');
assert.equal(new VarBit().toString(), 'ab');
VarBit.varId = 27 * 26 - 1;
assert.equal(new VarBit().toString(), 'zz');
assert.equal(new VarBit().toString(), 'aaa');
assert.equal(new VarBit().toString(), 'aab');

VarBit.varId = 0;
let a = new VarBit(), b = new VarBit(), c = new VarBit(), d = new VarBit();
let zero = new ConstantBit(0), one = new ConstantBit(1);

// NotBit
assert.equal(new NotBit(zero).toString(), '¬0');
assert.equal(new NotBit(a).toString(), '¬a');
assert.equal(new NotBit(new NotBit(a)).reduce().toString(), 'a');
assert.equal(new NotBit(zero).reduce().toString(), '1');
assert.equal(new NotBit(one).reduce().toString(), '0');

// XorBit
assert.equal(new XorBit([a, b]).toString(), '(a⊕b)');
assert.equal(new XorBit([a, new XorBit([b, c])]).reduce().toString(),
  '(a⊕b⊕c)');
assert.equal(new XorBit([a, a]).reduce().toString(), '0');
assert.equal(new XorBit([a]).reduce().toString(), 'a');
assert.equal(new XorBit([a, new NotBit(a)]).reduce().toString(), '1');
assert.equal(new XorBit([a, zero]).reduce().toString(), 'a');
assert.equal(new XorBit([a, one, a, one, b]).reduce().toString(), 'b');
assert.equal(new XorBit([one, a, one, a, one, b])
  .reduce().toString(), '¬b');
assert.equal(new XorBit([a, a, one, a, one, b])
  .reduce().toString(), '(a⊕b)');
assert.equal(new XorBit([a, one, a, one, a, one, b])
  .reduce().toString(), '¬(a⊕b)');
assert.equal(new NotBit(new XorBit([new NotBit(a), b]))
  .reduce().toString(), '(a⊕b)');

// OrBit
assert.equal(new OrBit([a, b]).toString(), '(a∨b)');
assert.equal(new OrBit([a, new OrBit([b, c])]).reduce().toString(),
  '(a∨b∨c)');
assert.equal(new OrBit([a, one]).reduce().toString(), '1');
assert.equal(new OrBit([a, zero]).reduce().toString(), 'a');
assert.equal(new OrBit([a, a]).reduce().toString(), 'a');
assert.equal(new OrBit([a, b, new NotBit(a)]).reduce().toString(), '1');
assert.equal(new OrBit([new NotBit(a), b, a]).reduce().toString(), '1');
assert.equal(new OrBit([a, new AndBit([b, a])]).reduce().toString(), 'a');
assert.equal(new OrBit([new AndBit([a, b]), new AndBit([a, c])])
  .reduce().toString(), '(a∧(b∨c))');
assert.equal(new OrBit([zero]).reduce().toString(), '0');
assert.equal(new OrBit([one]).reduce().toString(), '1');

// AndBit
assert.equal(new AndBit([a, b]).toString(), '(a∧b)');
assert.equal(new AndBit([a, new AndBit([b, c])]).reduce().toString(),
  '(a∧b∧c)');
assert.equal(new AndBit([a, zero]).reduce().toString(), '0');
assert.equal(new AndBit([a, one]).reduce().toString(), 'a');
assert.equal(new AndBit([a, a]).reduce().toString(), 'a');
assert.equal(new AndBit([a, new OrBit([b, a])]).reduce().toString(), 'a');
assert.equal(new AndBit([new OrBit([a, b]), new OrBit([a, c])])
  .reduce().toString(), '(a∨(b∧c))');
assert.equal(new AndBit([zero]).reduce().toString(), '0');
assert.equal(new AndBit([one]).reduce().toString(), '1');

// Buffer
let buf0 = Buffer.from([a, zero, b, new AndBit([a, c])]);
let buf1 = Buffer.from(
  [new NotBit(a), new XorBit([zero, c]), one, new AndBit([b, a]), c]);
assert.equal(new Buffer(4).size(), 4);
assert.equal(buf0.toString(), '[a, 0, b, (a∧c)]');
assert.equal(buf0.bitAt(2).toString(), 'b');
assert.equal(buf0.setBitAt(1, one).toString(), '1');
assert.equal(buf0.bitAt(1).toString(), '1');
buf0.setBitAt(1, zero);
assert.equal(buf0.slice(1, 3).toString(), '[0, b]');
assert.equal(buf0.not().reduce().toString(), '[¬a, 1, ¬b, ¬(a∧c)]');
assert.equal(buf0.xor(buf1).reduce().toString(),
  '[1, c, ¬b, ((a∧b)⊕(a∧c)), c]');
assert.equal(buf0.or(buf1).reduce().toString(),
  '[1, c, 1, (a∧(b∨c)), c]');
