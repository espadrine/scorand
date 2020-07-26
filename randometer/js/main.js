import {Buffer, UInt16} from '../../algebraic.js';

let measureBut, uniformityOutput;

function main() {
  measureBut = document.getElementById('measureBut');
  uniformityOutput = document.getElementById('uniformityOutput');
  measureBut.addEventListener('click', computeUniformity);
}

addEventListener('DOMContentLoaded', main);

function computeUniformity(event) {
  const next = lehmer16Output(lehmer16KeySchedule(makeKey(16)));
  const u = uniformity(next.output);
  uniformityOutput.value = u;
}

function uniformity(buf) {
  const probs = buf.bits.map(b => -Math.log2(Math.abs(0.5-b.probability())));
  return probs.reduce((acc, p) => (acc < p)? acc: p, 1);
}

function makeKey(size) {
  return new Buffer(size);
}

// The key schedule takes a key and returns the state.
function lehmer16KeySchedule(key) {
  return UInt16.from(key.bits);
}

// The output takes a state and returns {state, output}.
function lehmer16Output(state) {
  state = state.times(new UInt16(0xda942042e4dd58b5n));
  return { state, output: state.shiftRight(64) };
}

