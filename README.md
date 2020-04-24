## Parameters

- σ (speed) is bits per cycle rounded: precise ±0.1 (eg. ChaCha20: 0.4).
- p (period) such that its smallest proven cycle is 2^p GiB
  (eg. pcg64: 128+6-33 = 101, where 128 bits is the state size
  (which goes through all values),
  and 6 is log2(64) where 64 bits are output at each iteration).
- q (quality) such that it starts failing at 2^q GiB of PractRand
  (eg. Mersenne Twister: 8).
- π (predictability) such that a bit can be predicted after 2^i GiB
  for any seed (eg. ChaCha20: 42).

Score: σ versus λ = min(p, q) versus π.

When computing λ, we show the lower bound (proof), the upper bound (example or
proof), and the average (extrapolation or proof).

## Entrants

By order of expected quality:

- [ChaCha20][] ([Linux][/dev/urandom])
- [AES-CTR][] ([Windows][BCryptGenRandom], [macOS][AES-CTR-mac], [Swift][swift_stdlib_random])
- [pcg64][PCG]
- [jsf][]
- [Lehmer128][]
- [xorshift128+][] ([Firefox][], [Chrome][V8], [Safari][WebKit])
- [arc4random][] (macOS < 2017)
- [Mersenne Twister][mt19937] ([Python][mt-py], [Ruby][mt-rb])
- [drand48][] ([Java][drand48-Java])
- [ALFG607][] ([Go][ALFG-Go], [C++][ALFG-Boost])

[ChaCha20]: https://cr.yp.to/chacha/chacha-20080128.pdf
[/dev/urandom]: https://github.com/torvalds/linux/blob/219d54332a09e8d8741c1e1982f5eae56099de85/drivers/char/random.c#L1063
[Randen]: https://github.com/google/randen
[AES-CTR]: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf
[BCryptGenRandom]: https://docs.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptgenrandom
[AES-CTR-mac]: https://opensource.apple.com/source/Libc/Libc-1272.250.1/gen/FreeBSD/arc4random.c.auto.html
[swift_stdlib_random]: https://github.com/apple/swift/blob/d2e1f0916976583e6bba20cf550b9d9cfdb62612/stdlib/public/stubs/Random.cpp#L48-L50
[arc4random]: http://cypherpunks.venona.com/archive/1994/09/msg00304.html
[Lehmer128]: https://lemire.me/blog/2019/03/19/the-fastest-conventional-random-number-generator-that-can-pass-big-crush/
[PCG]: http://www.pcg-random.org/posts/pcg-passes-practrand.html
[ALFG607]: https://en.wikipedia.org/wiki/Lagged_Fibonacci_generator
[ALFG-Go]: https://golang.org/src/math/rand/rng.go
[ALFG-Boost]: https://www.boost.org/doc/libs/1_60_0/doc/html/boost_random/reference.html#boost_random.reference.concepts
[jsf]: http://burtleburtle.net/bob/rand/smallprng.html
[gjrand]: http://gjrand.sourceforge.net/
[xorshift128+]: http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
[Firefox]: https://dxr.mozilla.org/mozilla-central/source/mfbt/XorShift128PlusRNG.h#65
[V8]: https://cs.chromium.org/chromium/src/v8/src/base/utils/random-number-generator.h?l=119
[WebKit]: https://trac.webkit.org/browser/webkit/trunk/Source/WTF/wtf/WeakRandom.h#L91
[mt19937]: http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
[mt-py]: https://docs.python.org/3/library/random.html
[mt-rb]: https://ruby-doc.org/core-2.6.5/Random.html
[drand48]: http://man7.org/linux/man-pages/man3/drand48.3.html
[drand48-Java]: https://hg.openjdk.java.net/jdk/jdk/file/db9bdbeaed29/src/java.base/share/classes/java/util/Random.java

## Classic flaws

- Weak seeds (typically zero)
- Low-bit bias
- Zeroland
- Correlated seeds (visible from tests on interleaving PRNGs with 1-bit
  difference in seed)
- Correlated streams
- Non-uniform distribution (eg. impossible, or unlikely, outputs)
- Reduced-round or -size bias

## Other resources

- [Peter Occil][]’s *Random Number Generator Recommendations for Applications*.

[Peter Occil]: https://peteroupc.github.io/random.html
