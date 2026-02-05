# Fitness Supreme

## Abstract

Fitness Supreme is a single page application (mobile first) that tracks several fitness benchmarks and calculates an index out of them to provide feedback to the athlete about his or her progression and to ground the athlete's trainings effort in a standardize comparable single performance indicator.

## Model

The index calculation is done via a multi tier model, that relies on proof:

- Buddy system, where an athlete with high index guarantees for another athlete
- Escrow
- Video proof
  Further more the higher tiers are bound to the fulfillment of lower tier progression steps and milestones. The calculation model applies a gamified approach to nudge the athlete via progression steps towards the milestones and ultimately towards a level-up to the next tier and the new sets of progression steps and milestones.

## Implementation Aspects

- For application architecture consult [Architecture](./.agent/architecture.md)
- For coding guidelines consult [Architecture](./.agent/coding-guide.md)
- For UI/UX guide and hints consult [Architecture](./.agent/ui-ux.md)

## Collective Memory & ADRs

- Keep track of all relevant implementation and architectural decisions during feature implementation, refactoring and debugging in [long term memory](LTM.md)
