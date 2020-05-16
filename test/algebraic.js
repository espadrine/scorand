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
let buf = new Buffer(4);
assert.equal(buf.size(), 4);
assert.equal(Buffer.from([b,
  new AndBit([a, one])]).toString(), '[b, (a∧1)]');
assert.equal(buf.bitAt(1).toString(), 'bo');
assert.equal(buf.setBitAt(1, one).toString(), '1');
assert.equal(buf.bitAt(1).toString(), '1');
assert.equal(buf.slice(1, 3).toString(), '[1, bp]');
assert.equal(buf.not().reduce().toString(), '[¬bn, 0, ¬bp, ¬bq]');
