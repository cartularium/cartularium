# IronCalc display-precision read-back — cross-cutting note

**Batch:** financial · **Subjects:** CUMIPMT, CUMPRINC, DB, DDB, NPER, NPV, PMT, IRR, MIRR, TBILLEQ, TBILLPRICE, TBILLYIELD, XIRR, RATE · **Confidence:** high

## What this is

Across the time-value and Treasury-bill suites, IronCalc very frequently forms its **own agreement
class** whose only distinguishing feature is that the number has fewer significant digits than
every other engine's. This is not an algorithmic divergence — IronCalc computes the same underlying
value — it is a **value-capture / format-rendering** property: the recorded (and live) IronCalc
result is captured at reduced display precision.

## Live evidence

I ran IronCalc live and it reproduces the reduced-precision values exactly (so this is not a stale
fixture):

| formula                                             | IronCalc (live & fixture) | full-precision peers                                             |
| --------------------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `=CUMIPMT(0.05/12,360,100000,1,12,0)`               | -4966.49                  | -4966.494130578189 (Excel/gsheets); -4966.4941306 (HyperFormula) |
| `=PMT(0.06/12,360,0,1000000)`                       | -995.51                   | -995.505251527523                                                |
| `=NPER(0.05/12,-1073.64,200000)`                    | 360                       | 360.00252148785387                                               |
| `=DDB(1000,100,10,10)`                              | 26.84                     | 26.843545600000024                                               |
| `=NPV(0.1,-1000,300,300,300,300,300)`               | 124.76                    | 124.76002802048566                                               |
| `=TBILLYIELD(DATE(2011,2,15),DATE(2011,5,15),98.5)` | 0.0616                    | 0.0615981292420008                                               |
| `=IRR(A1:A4)` [−10000,3000,4200,6800]               | 0.16                      | 0.16340560068898924                                              |
| `=MIRR(A1:A4,0.1,0.1)`                              | 0.18                      | 0.18285814860293526                                              |
| `=IPMT(0.05/12,360,360,-200000)`                    | 4.454951228               | 4.454951228316506                                                |

Note the number of digits IronCalc keeps varies with magnitude (−4966.49 keeps 2 decimals,
4.454951228 keeps ~10 significant digits, 360 is exact). This pattern is consistent with a General/
default-format read-back that fits the value into a fixed display budget and then re-parses the
displayed string, rather than reading the engine's raw double. **Cause bucket: precision.**

## Why it matters for the catalogue

- IronCalc will almost always land in its own class on any non-trivial irrational/long-decimal
  numeric result, purely from this read-back. When reconciling forks, IronCalc-alone numeric classes
  that are equal-to-display-precision with the other engines should be treated as **agreement at
  IronCalc's captured precision**, not as a computed divergence.
- This is a good candidate for a driver-level fix (capture the raw value instead of the formatted
  display value). Until then, any tolerance comparison in a consumer lens should be generous enough
  to absorb IronCalc's rounding (which can be as coarse as 2 decimal places).

## Wiki-facing notes

- Do not report "IronCalc computes X for PMT/IRR/etc." as a distinct numeric answer — it computes
  the same value as the other engines but the catalogue captured it at display precision.

## Open questions

- Confirm whether this is the IronCalc _driver's_ read-back path (most likely) or the IronCalc
  engine's own default numeric formatting. Either way the underlying computation matches peers.
