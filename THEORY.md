# A Theory Of Randomness

## Information Theory

A good **Pseudo-Random Number Generator** (PRNG)
is one indistinguishable from true random output (TRNG).

In the case of a uniform generator: for all finite sets of N integers
(eg. from 0 to 2^B-1, with B-bit outputs),
the frequency of outputs from any subset of size S must converge to S÷N.

That means the bit 1 should appear half the time,
11 should appear a quarter of the time,
111 should appear an eighth of the time.
More generally, a sequence of R ones should appear with frequency 2^-R.

Sadly, the largest sequence of 1s you can obtain
from a PRNG with B bits of memory is 3×B-2.

Indeed, if your PRNG’s state causes it to output B 1s,
the state must switch to a different configuration,
and therefore output something else than B ones (eg. B-1 ones and a zero);
or else it will always output B ones, and never any zeroes.

This brings an interesting result: true random output requires infinite memory.

## Cycle analysis

It is easy to improve a bad PRNG by giving it more memory.
However, a good PRNG will improve too, potentially faster.

## Reversibility

Haphazardly constructed PRNGs are poor.

## Diffusion

Avalanche effect of flipping a single bit of the state.

Maximum number of rounds needed to flip all state bits when starting with a
state with a single bit set.

## Predictability

In cryptography, a PRNG must prevent an attacker from guessing the next bit.

Therefore, the seed must not be guessed,
even from reading large quantities of PRNG output.

The seed is then like the key of a symmetric encryption.
(In fact, all CSPRNG can be used as a cipher by XORing the plaintext with it.)

Just like cycle analysis, there is a hard limit to that:
the attacker can detect when reaching the end of the cycle,
and know that it will output the same values back again.

## Algebraic analysis

Each bit of output should be affected by the maximum number of bits of
input, without collapsing to a trivial formula.

## Bibliography

- The [PractRand RNGs analysis][PractRandRNGs] gives some insight into various
  factors that make up a good generator.

[PractRandRNGs]: http://pracrand.sourceforge.net/RNG_engines.txt
