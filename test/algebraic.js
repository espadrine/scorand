import {strict as assert} from 'assert';
import {ConstantBit, VarBit, NotBit, XorBit, AndBit, OrBit}
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
let a = new VarBit(), b = new VarBit(), c = new VarBit();
let zero = new ConstantBit(0), one = new ConstantBit(1);

// NotBit
assert.equal(new NotBit(zero).toString(), '¬0');
assert.equal(new NotBit(a).toString(), '¬a');
assert.equal(new NotBit(new NotBit(a)).reduce().toString(), 'a');
assert.equal(new NotBit(zero).reduce().toString(), '1');

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

// OrBit
assert.equal(new OrBit([a, b]).toString(), '(a∨b)');
assert.equal(new OrBit([a, new OrBit([b, c])]).reduce().toString(),
  '(a∨b∨c)');
assert.equal(new OrBit([a, one]).reduce().toString(), '1');
assert.equal(new OrBit([a, zero]).reduce().toString(), 'a');

// AndBit
assert.equal(new AndBit([a, b]).toString(), '(a∧b)');
assert.equal(new AndBit([a, new AndBit([b, c])]).reduce().toString(),
  '(a∧b∧c)');
