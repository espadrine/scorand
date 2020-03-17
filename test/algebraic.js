import {strict as assert} from 'assert';
import {ConstantBit, VarBit, XorBit} from '../algebraic.js';

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

// XorBit
assert.equal(new XorBit(new VarBit(), new VarBit()).toString(), '(a⊕b)');
