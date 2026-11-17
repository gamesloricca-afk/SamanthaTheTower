import { describe, expect, it } from 'vitest'
import { resolveWithConfidence } from '../../src/knowledge'

/** Pin player stat names to the intended concepts. */
describe('player stat name resolution', () => {
  it.each([
    ['Attack Speed', 'attackSpeed'],
    ['Death Defy', 'deathDefy'],
    ['Lifesteal', 'lifesteal'],
  ])('resolves %s to its own stat', (name, id) => {
    expect(resolveWithConfidence(name).id).toBe(id)
  })
})
