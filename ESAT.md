# Solving ESAT

ESAT is the following problem: given a boolean function E(X)
over a set of boolean variables X, compute its expected value
assuming each variable is an independent uniform Bernoulli trial.

ESAT is related to a well-known problem, #SAT, in the following way:
ESAT(E) = #SAT(E) ÷ |X|.
Therefore, computing one lets you compute the other, and vice-versa.
However, focusing on the formulation of the problem as ESAT
will simplify our ability of producing a good estimate,
which in turn can be used to yield a good #SAT estimate.

E(X) naturally decomposes in a subexpression S(X).

If E(X) = ¬S(X), we recursively compute ESAT(E) = 1 - ESAT(S).

If E(X) = (S1∪S2)(X), we recursively compute
ESAT(E) = ESAT(S1) + ESAT(S2) - ESAT(S1∩S2).

## AND

The last case, when E = S1 ∩ S2, is the more subtle.

First, construct V, the set of variables commonly used by S1 and S2.

If V is the empty set, the expressions are independent,
and therefore, we can recursively compute ESAT(E) = ESAT(S1) · ESAT(S2).

In fact, assuming the subexpressions are independent,
it is easy to compute any expression from its truth table.
For instance, for XOR:

<table>
  <tr><th> S1 <th> S2 <th> S1⊕S2
  <tr><td>  0 <td>  0 <td> 0
  <tr><td>  0 <td>  1 <td> 1
  <tr><td>  1 <td>  0 <td> 1
  <tr><td>  1 <td>  1 <td> 0
</table>

… you would compute
ESAT(S1⊕S2) = (1-ESAT(S1))·ESAT(S2) + ESAT(S1)·(1-ESAT(S2)).

Second, let us consider the following question:
if you flip constituting bit Xi, what is the probability that E flips?

To develop this, note that the probability that E is true is
p(S1∩S2) = p(S1|S2)·p(S2) = p(S2|S1)·p(S1).
Thus p(S1∩S2) = p(S1)·p(S2) · (p(S1|S2) ÷ p(S1)).

Note that this formula is very close to that
where S1 and S2 are independent. In particular, it ranges from:

- p(S1|S2) ÷ p(S1) = 1: *S1 is independent from S2*.
- p(S1|S2) ÷ p(S1) = 1÷p(S1)=1÷p(S2): *S1 is fully determined and set by
  S2*.
- p(S1|S2) ÷ p(S1) = 0: *S1 is fully determined and reset by S2*.

(By *reset* we mean that S2 being true makes S1 false.)

Let us call K the quantity ranged above.
Note that K = p(S1∩S2) ÷ p(S1) ÷ p(S2).

### 2D Model Paradox

A curious paradox arises from the use of the traditional 2D visualization
for probability theory.
I will dig into it, to enhance our understanding of the problem.

It is common to represent events as 2D shapes on a plane.
Those events may be disjoint (they are then exclusive),
or overlap (their intersection is then S1∩S2,
which is of particular interest for our analysis).

In this model, the plane is Ω, the set of all elementary events,
each a distinct exclusive outcome.
The probability of an event is then the area of the shape,
divided by the area of the plane.

The two shapes S1 and S2 fully match if and only if K = 1÷p(S1).
Indeed, the area of their intersection is equal to
each shape’s area.
In this case, one event is fully determined by the other:
either they both happen, or none do.

The two shapes are fully disjoint if and only if K = 0.
Yet again, one event is fully determined by the other:
if one happens, the other does not.

Finally, there is a given overlap proportion such that K = 1.
That happens when the area of the intersection of the shapes
is equal to the product of the areas of the shapes.
In this proportion, the events are independent.

The paradox comes from imagining the two shapes starting fully overlapped,
and then moving one shape out of the way until they are disjoint.
They therefore go from K = 1÷p(S1), to 0, monotonously.
During the process, K cannot reach 1÷p(S1) again,
since it would mean that the shapes are again fully overlapped.

However, during the process, the shapes must reach the given ratio
such that they are independent, and therefore, that K = 1.

The solution to this paradox comes from the breakdown of the model
as an infinitely dense collection of elementary events.
Each elementary event is discrete, not continuous,
and therefore one cannot arbitrarily move a shape
to any location with infinite precision.

Furthermore, the quality of event independence is tied to
the quantity of elementary events that are outside of the events considered.
Every time one moves the shape,
they make events that were previously outside get inside the shape.
However, **the more events there are outside,
the smaller the intersection must be to get independence**,
potentially going below the level of individual discrete events.

It becomes very obvious when discretizing the paradox.
Take a space with 2·N elementary events,
in which two shapes encompass the same set of N of them.
This is the starting situation of the paradox.
Then, include one outside event to the first shape,
and exclude one intersection event (which remains in the second shape).

You will get independence of the two shapes when
the number of events in the intersection is equal to
the product of their cardinals (the number of events in the shape).
Since each shape always has N events in it, that product is N².

- If the independent intersection has just one event in it,
  the shapes must include N = 1 event;
  then there are only two situations: the shapes fully overlapping,
  and the shapes being fully disjoint, with no paradox.
  They are independent when they fully overlap.
- If the independent intersection has I > 1 events in it,
  then the shapes must include √I < 1 events, which cannot happen,
  thus ensuring that the shapes get disjointed
  without ever being independent.

It may seem that shapes can never be independent.
But if you step back from the flawed 2D model and look at it cardinally,
then it becomes obvious that the quantity of events outside
defines the nature of independence.

Indeed, you get independence for p(S1∩S2) = p(S1)·p(S2),
thus |S1∩S2|÷|Ω| = |S1|·|S2|÷|Ω|²,
hence |Ω| = |S1|·|S2|÷|S1∩S2|.
To make two overlapping shapes independent,
you just need to set the number of elementary events outside of them
to ω<sub>o</sub> = |S1|·|S2|÷|S1∩S2|-|S1∪S2|.

You can develop the quadratic equation that comes from
ω<sub>o</sup> = |S1|·|S2|÷|S1∩S2|-|S1|-|S2|+|S1∩S2| to get
|S1∩S2| = (ω<sub>o</sub>+|S1|+|S2|-√((ω<sub>o</sub>+|S1|+|S2|)²-4·|S1|·|S2|)) ÷ 2,
which rapidly converges to zero.
As a result, when ω<sub>o</sub> > |S1|·|S2|-|S1|-|S2|+1,
the events S1 and S2 can no longer be independent,
as their intersection would require having
less than one elementary event.

### Hypercube model

A better model for understanding the problem is
that of an N-dimensional two-by-two cube,
where N is the number of variables in the boolean expression.

To better visualize it, we will add dimensions one by one.
With a single dimension,
the expression contains a single boolean variable X1.
It has two possible values,
which are two boxes placed horizontally side by side.

An event is an algebraic expression of this boolean value.
Any given event is represented as a subset of the boxes.
For instance, the expression “false” is the empty set of boxes;
“true” is both boxes; “X” is the right box; “¬X” is the left box.

To add a variable X2, you duplicate your set of two boxes vertically.
Now, you have a set of four boxes in a 2×2 square.
The principles are the same: “X1∧X2” is the top-right box;
the XOR is the descending diagonal.

One more time, with X3: you duplicate the set along the height.
For instance, the top-right box of the first level,
plus the bottom-left box of the second level, is “(X1∧X2)∨(X3∧¬(X1∨X2)”.
The XOR of the three is the descending diagonal of the first level,
plus the ascending diagonal of the second level.
Your 2×2×2 cube can now express
2<sup>2<sup>3</sup></sup> = 256 boolean formulae
thanks to its 2<sup>3</sup> = 8 boxes.
As you can see, the number of possible events grows super-exponentially.
That growth is beyond factorial.

An interesting theorem is that,
no matter how much you build the hypercube tower with more dimensions,
for any subset of cube, even the really weird and random ones,
there exists an algebraic representation for it using only AND and NOT.
However, obviously, the formulae commonly used are likely to have few terms,
and therefore, some subsets are more likely to appear in practice.
We can ensure that those have more precise ESAT approximations.

Now that we have built the modelization,
the concept of **event independence** is both trivial,
and has extremely strong properties.

An event is independent of a variable if it is a cylinder
along that variable’s dimension.
In other words, each box must be included in the event
both for X and ¬X.
Obviously, when you do this to an event,
it loses a whole dimension of expressiveness:
it is only left with the square root of
the number of possible boolean expressions it had before,
because 2<sup>2<sup>N-1</sup></sup> = 2<sup>2<sup>N</sup>÷2</sup>.
What is left is the event’s hyperplane:
it can pick whichever events it desires along those dimensions.

Two events are independent if their hyperplanes are perpendicular.
As a result, there is no variable that they both depend on.

TODO

## Computation

Take the common variables.

For each possible common variable assignment (2^N),
compute the probability of the expression assuming that assignment.
Sum the resulting probabilities, since they are exclusive.

You can do this exhaustively for up to 32 common variables.
Past that, you can instead perform Monte-Carlo estimations.


---


p(A|Xi)÷p(A) = 2·p(Xi|A)


p(S1∩S2) = p(S1|S2) p(S2) = p(S2|S1) p(S1)
p(S1|Xi) = p(S1∩Xi) ÷ p(Xi)
p(S2|Xi) = p(S2∩Xi) ÷ p(Xi)
p(S1) = p(S1|Xi) p(Xi) + p(S1|¬Xi) p(¬Xi)
p(S1|S2) = p(S1|Xi|S2) p(Xi|S2) + p(S1|¬Xi|S2) p(¬Xi|S2)

p(S1∩S2|Xi) = p(S1∩S2∩Xi) ÷ p(Xi)
p(S1∩S2|Xi) = p(S1|S2∩Xi) · p(S2|Xi)

p(∩Xi) = Π p(Xi) = ½^|X|
p(Xi) = p(Xi|Xj)
p(S1|∩Xi) = p(∩Xi|S1) p(S1) ÷ p(∩Xi)

## Future

This can be the basis for a theory, called Phenomenon Theory,
that inverts the basis of probability theory.
Instead of probabilities being based on unknowns,
we assume that every phenomenon can be known,
and compute probabilities to represent our failure to model a phenomenon.

That theory would combine together statistics,
both frequentist and bayesian probability theory,
information theory, and algorithmics.

Indeed, each phenomenon would be modeled
as a source of observable events,
wherein the source is a machine
computing a fixed algorithm with a given amount of memory,
yielding a given phenomenon as the output of each computation.

Probabilities would then score the error of an algorithmic estimator
with a lower amount of memory than that of the source.

A true random source, in this context,
would then require infinite memory, which can also be modeled,
but is obviously not fundamentally interesting,
since the amount of physical memory available in the universe is bounded.

This would potentially help reframe Bell’s theorem.
