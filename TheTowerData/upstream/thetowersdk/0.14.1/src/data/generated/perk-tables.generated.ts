// Generated file — do not edit by hand.
/**
 * Perk value tables, read from `Perks.Initialize` in the v28.3 binary.
 *
 * NOT editor data: the serialized MonoBehaviour has these arrays sized 50 and
 * entirely zero. Every value below is a compile-time literal.
 *
 * Index gaps at 15-19 and 29-39 are real — the perk index space is three
 * blocks, not a dense range.
 */
export const V283_PERK_MAX_LEVEL = {
  "0": 5,
  "1": 5,
  "2": 5,
  "3": 5,
  "4": 3,
  "5": 5,
  "6": 5,
  "7": 2,
  "8": 5,
  "9": 5,
  "10": 3,
  "11": 1,
  "12": 1,
  "13": 5,
  "14": 5,
  "20": 1,
  "21": 1,
  "22": 1,
  "23": 1,
  "24": 1,
  "25": 1,
  "26": 1,
  "27": 1,
  "28": 1,
  "40": 1,
  "41": 1,
  "42": 1,
  "43": 1,
  "44": 1,
  "45": 1,
  "46": 1,
  "47": 1,
  "48": 1,
  "49": 1,
} as const

/** The additive base a multiplicative perk starts from: 1 for x-perks, 0 otherwise. */
export const V283_PERK_BENEFIT_UP_BASE = {
  "0": 1,
  "1": 1,
  "2": 1,
  "3": 1,
  "4": 0,
  "5": 1,
  "6": 0,
  "7": 0,
  "8": 0,
  "9": 0,
  "10": 0,
  "11": 0,
  "12": 0,
  "13": 1,
  "14": 1,
} as const

/** The per-level benefit. This is the number that appears in the perk's name. */
export const V283_PERK_BENEFIT_UP_INCREASE = {
  "0": 0.2,
  "1": 0.15,
  "2": 0.75,
  "3": 0.15,
  "4": 2,
  "5": 0.5,
  "6": 3.5,
  "7": 1,
  "8": 5,
  "9": 0.04,
  "10": 0.2,
  "11": 0,
  "12": 1,
  "13": 0.15,
  "14": 0.15,
  "20": 4,
  "21": 1.5,
  "22": 1,
  "23": 0,
  "24": 1.5,
  "25": 2,
  "26": 5,
  "27": 12,
  "28": 1.5,
  "40": 1.5,
  "41": 1.8,
  "42": 0.5,
  "43": 0.5,
  "44": 0,
  "45": 0.4,
  "46": 12,
  "47": 8,
  "48": 0.699999988079071,
  "49": 2.5,
} as const

/** The penalty side of a trade-off perk. */
export const V283_PERK_BENEFIT_DOWN = {
  "40": 8,
  "41": 0.30000001192092896,
  "42": 0.10000000149011612,
  "43": 0.5,
  "44": 3,
  "45": 2.5,
  "46": 0,
  "47": 0.4,
  "48": 0.5,
  "49": 0,
} as const
