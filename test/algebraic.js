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
assert.equal(new NotBit(zero).toString(), '¬0',
  'NOT display');
assert.equal(new NotBit(a).toString(), '¬a',
  'NOT display with variable');
assert.equal(new NotBit(new NotBit(a)).reduce().toString(), 'a',
  'NOT Double negation');
assert.equal(new NotBit(zero).reduce().toString(), '1',
  'NOT zero');
assert.equal(new NotBit(one).reduce().toString(), '0',
  'NOT one');

// XorBit
assert.equal(new XorBit([a, b]).toString(), '(a⊕b)',
  'XOR display');
assert.equal(new XorBit([a, new XorBit([b, c])]).reduce().toString(),
  '(a⊕b⊕c)',
  'XOR associativity');
assert.equal(new XorBit([a, a]).reduce().toString(), '0',
  'XOR positive annihilation');
assert.equal(new XorBit([a, new NotBit(a)]).reduce().toString(), '1',
  'XOR negative annihilation');
assert.equal(new XorBit([a, zero]).reduce().toString(), 'a',
  'XOR positive identity');
assert.equal(new XorBit([a, one, a, one, b]).reduce().toString(), 'b',
  'XOR double negative identity');
assert.equal(new XorBit([one, a, one, a, one, b])
  .reduce().toString(), '¬b',
  'XOR negative identity');
assert.equal(new XorBit([a, a, one, a, one, b])
  .reduce().toString(), '(a⊕b)',
  'XOR double negative identity and positive annihilation');
assert.equal(new XorBit([a, one, a, one, a, one, b])
  .reduce().toString(), '¬(a⊕b)',
  'XOR negative identity and positive annihilation');
assert.equal(new NotBit(new XorBit([new NotBit(a), b]))
  .reduce().toString(), '(a⊕b)',
  'XOR double negation');
assert.equal(new NotBit(new XorBit([a, one, b]))
  .reduce().toString(), '(a⊕b)',
  'XOR negation and negative identity');
assert.equal(new XorBit([zero]).reduce().toString(), '0',
  'XOR zero');
assert.equal(new XorBit([one]).reduce().toString(), '1',
  'XOR one');
assert.equal(new XorBit([a]).reduce().toString(), 'a',
  'XOR unary');

// OrBit
assert.equal(new OrBit([a, b]).toString(), '(a∨b)',
  'OR display');
assert.equal(new OrBit([a, new OrBit([b, c])]).reduce().toString(),
  '(a∨b∨c)',
  'OR associativity');
assert.equal(new OrBit([a, one]).reduce().toString(), '1',
  'OR annihilator');
assert.equal(new OrBit([a, b, new NotBit(a)]).reduce().toString(), '1',
  'OR complementation');
assert.equal(new OrBit([new NotBit(a), b, a]).reduce().toString(), '1',
  'OR complementation');
assert.equal(new OrBit([a, zero]).reduce().toString(), 'a',
  'OR identity');
assert.equal(new OrBit([a, a]).reduce().toString(), 'a',
  'OR idempotence');
assert.equal(new OrBit([a, new AndBit([b, a])]).reduce().toString(), 'a',
  'OR absorption');
assert.equal(new OrBit([new AndBit([a, b]), new AndBit([a, c])])
  .reduce().toString(), '(a∧(b∨c))',
  'OR distributivity');
assert.equal(new OrBit([zero]).reduce().toString(), '0',
  'OR zero');
assert.equal(new OrBit([one]).reduce().toString(), '1',
  'OR one');
assert.equal(new OrBit([a]).reduce().toString(), 'a',
  'OR unary');

// AndBit
assert.equal(new AndBit([a, b]).toString(), '(a∧b)',
  'AND display');
assert.equal(new AndBit([a, new AndBit([b, c])]).reduce().toString(),
  '(a∧b∧c)',
  'AND associativity');
assert.equal(new AndBit([a, zero]).reduce().toString(), '0',
  'AND annihilator');
assert.equal(new AndBit([a, b, new NotBit(a)]).reduce().toString(), '0',
  'AND complementation');
assert.equal(new AndBit([new NotBit(a), b, a]).reduce().toString(), '0',
  'AND complementation');
assert.equal(new AndBit([a, one]).reduce().toString(), 'a',
  'AND identity');
assert.equal(new AndBit([a, a]).reduce().toString(), 'a',
  'AND idempotence');
assert.equal(new AndBit([a, new OrBit([b, a])]).reduce().toString(), 'a',
  'AND absorption');
assert.equal(new AndBit([new OrBit([a, b]), new OrBit([a, c])])
  .reduce().toString(), '(a∨(b∧c))',
  'AND distributivity');
assert.equal(new AndBit([zero]).reduce().toString(), '0',
  'AND zero');
assert.equal(new AndBit([one]).reduce().toString(), '1',
  'AND one');
assert.equal(new AndBit([a]).reduce().toString(), 'a',
  'AND unary');

// Buffer
let buf0 = Buffer.from([a, zero, b, new AndBit([a, c])]);
let buf1 = Buffer.from(
  [new NotBit(a), new XorBit([zero, c]), one, new AndBit([b, a]), c]);
assert.equal(new Buffer(4).size(), 4,
  'BUFFER size');
assert.equal(buf0.toString(), '[a, 0, b, (a∧c)]',
  'BUFFER display');
assert.equal(buf0.bitAt(2).toString(), 'b',
  'BUFFER bitAt');
assert.equal(buf0.setBitAt(1, one).toString(), '1',
  'BUFFER setBitAt');
assert.equal(buf0.bitAt(1).toString(), '1',
  'BUFFER setBitAt');
buf0.setBitAt(1, zero);
assert.equal(buf0.slice(1, 3).toString(), '[0, b]',
  'BUFFER slice');
assert.equal(buf0.not().reduce().toString(), '[¬a, 1, ¬b, ¬(a∧c)]',
  'BUFFER not');
assert.equal(buf0.xor(buf1).reduce().toString(),
  '[1, c, ¬b, ((a∧b)⊕(a∧c)), c]',
  'BUFFER xor');
assert.equal(buf0.or(buf1).reduce().toString(),
  '[1, c, 1, (a∧(b∨c)), c]',
  'BUFFER or');
assert.equal(buf0.and(buf1).reduce().toString(),
  '[0, 0, b, (a∧b∧c), c]',
  'BUFFER and');
assert.equal(buf0.shiftRight(2).reduce().toString(),
  '[0, 0, a, 0]',
  'BUFFER shiftRight');
assert.equal(buf0.shiftRight(0).reduce().toString(),
  '[a, 0, b, (a∧c)]',
  'BUFFER shiftRight zero');
assert.equal(buf0.shiftRight(9).reduce().toString(),
  '[0, 0, 0, 0]',
  'BUFFER shiftRight beyond bounds');
assert.equal(buf0.shiftRight(-1).reduce().toString(),
  '[0, b, (a∧c), 0]',
  'BUFFER shiftRight negative');
assert.equal(buf0.shiftLeft(2).reduce().toString(),
  '[b, (a∧c), 0, 0]',
  'BUFFER shiftLeft');
assert.equal(buf0.shiftLeft(0).reduce().toString(),
  '[a, 0, b, (a∧c)]',
  'BUFFER shiftLeft zero');
assert.equal(buf0.shiftLeft(9).reduce().toString(),
  '[0, 0, 0, 0]',
  'BUFFER shiftLeft beyond bounds');
assert.equal(buf0.shiftLeft(-1).reduce().toString(),
  '[0, a, 0, b]',
  'BUFFER shiftLeft negative');

//m.rotateRight(n, 2)
//m.rotateLeft(n, 2)
//m = new UInt32(4294967295)
//n = new UInt32()
//n.set(3);
//m.plus(n)
//m.negative()
//m.minus(n)
//m.times(n)
//m.dividedBy(n)
//m.modulo(n)
//m.power(n)
//m.probabilityOfBitAt(1)
