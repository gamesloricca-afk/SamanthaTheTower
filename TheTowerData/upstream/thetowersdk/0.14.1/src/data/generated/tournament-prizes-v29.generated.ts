/**
 * GENERATED from game data for version v29.0.0 — tournament prize table
 * (InitTournamentPrizes: gems / stones / keys by rank band).
 *
 * Keys: omitted entries are **0** (zero-fill).
 * pre29* startRank/endRank: **never stored** in InitTournamentPrizes — left null here (do not invent).
 */

export const TOURNAMENT_PRIZES_V29_PROVENANCE =
  'Observed in game (v29.0.0 tournament prizes)'

export interface TournamentPrizeEntryV29 {
  startRank: number | null
  endRank: number | null
  gems: number
  stones: number
  keys: number
}

function row(
  startRank: number | null,
  endRank: number | null,
  gems: number,
  stones: number,
  keys: number,
): TournamentPrizeEntryV29 {
  return { startRank, endRank, gems, stones, keys }
}

export const COPPER_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 100, 20, 0),
  row(2, 2, 80, 18, 0),
  row(3, 4, 65, 16, 0),
  row(5, 6, 50, 12, 0),
  row(7, 8, 45, 10, 0),
  row(9, 10, 40, 9, 0),
  row(11, 12, 30, 8, 0),
  row(13, 15, 20, 7, 0),
  row(16, 22, 15, 6, 0),
  row(23, 30, 10, 5, 0),
] as const

export const SILVER_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 200, 40, 0),
  row(2, 2, 150, 35, 0),
  row(3, 4, 100, 30, 0),
  row(5, 6, 75, 20, 0),
  row(7, 8, 65, 19, 0),
  row(9, 10, 60, 18, 0),
  row(11, 12, 55, 17, 0),
  row(13, 15, 50, 16, 0),
  row(16, 22, 45, 14, 0),
  row(23, 30, 40, 12, 0),
] as const

export const GOLD_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 300, 80, 0),
  row(2, 2, 250, 70, 0),
  row(3, 4, 200, 60, 0),
  row(5, 6, 150, 40, 0),
  row(7, 8, 125, 30, 0),
  row(9, 10, 100, 28, 0),
  row(11, 12, 90, 26, 0),
  row(13, 15, 80, 24, 0),
  row(16, 22, 70, 22, 0),
  row(23, 30, 50, 20, 0),
] as const

export const PLATINUM_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 425, 160, 0),
  row(2, 2, 400, 140, 0),
  row(3, 4, 375, 120, 0),
  row(5, 6, 275, 70, 0),
  row(7, 8, 260, 65, 0),
  row(9, 10, 245, 60, 0),
  row(11, 12, 230, 56, 0),
  row(13, 15, 215, 53, 0),
  row(16, 24, 200, 50, 0),
  row(25, 30, 100, 20, 0),
] as const

export const CHAMPION_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 550, 320, 0),
  row(2, 2, 525, 300, 0),
  row(3, 4, 500, 280, 0),
  row(5, 6, 375, 200, 0),
  row(7, 8, 360, 175, 0),
  row(9, 10, 345, 150, 0),
  row(11, 12, 330, 125, 0),
  row(13, 15, 315, 100, 0),
  row(16, 24, 300, 90, 0),
  row(25, 30, 175, 20, 0),
] as const

/** Grand Champion in dump field `grandChampionTournamentPrizes` (SDK league name Legend). */
export const GRAND_CHAMPION_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 675, 375, 25),
  row(2, 2, 650, 350, 20),
  row(3, 4, 625, 325, 15),
  row(5, 6, 475, 275, 10),
  row(7, 8, 460, 260, 8),
  row(9, 10, 445, 245, 6),
  row(11, 12, 430, 230, 4),
  row(13, 15, 415, 215, 2),
  row(16, 24, 400, 200, 1),
  row(25, 30, 250, 100, 0),
] as const

export const MYTHIC_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(1, 1, 900, 475, 50),
  row(2, 2, 800, 450, 45),
  row(3, 4, 700, 425, 40),
  row(5, 6, 650, 400, 37),
  row(7, 8, 600, 385, 34),
  row(9, 10, 575, 370, 31),
  row(11, 12, 550, 355, 28),
  row(13, 15, 525, 340, 25),
  row(16, 24, 500, 325, 20),
  row(25, 30, 335, 225, 8),
] as const

/** Ranks not written in Init — gems/stones/keys only (keys zero-fill where unset). */
export const PRE29_PLATINUM_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(null, null, 400, 160, 0),
  row(null, null, 350, 140, 0),
  row(null, null, 300, 120, 0),
  row(null, null, 250, 70, 0),
  row(null, null, 225, 65, 0),
  row(null, null, 200, 60, 0),
  row(null, null, 175, 56, 0),
  row(null, null, 150, 53, 0),
  row(null, null, 125, 50, 0),
  row(null, null, 100, 20, 0),
] as const

export const PRE29_CHAMPION_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(null, null, 600, 320, 0),
  row(null, null, 500, 300, 0),
  row(null, null, 400, 280, 0),
  row(null, null, 350, 200, 0),
  row(null, null, 325, 175, 0),
  row(null, null, 300, 150, 0),
  row(null, null, 275, 125, 0),
  row(null, null, 250, 100, 0),
  row(null, null, 200, 90, 0),
  row(null, null, 150, 20, 0),
] as const

export const PRE29_GRAND_CHAMPION_TOURNAMENT_PRIZES_V29: readonly TournamentPrizeEntryV29[] = [
  row(null, null, 800, 425, 25),
  row(null, null, 700, 400, 20),
  row(null, null, 600, 375, 15),
  row(null, null, 500, 350, 10),
  row(null, null, 475, 325, 8),
  row(null, null, 450, 300, 6),
  row(null, null, 425, 275, 4),
  row(null, null, 400, 250, 2),
  row(null, null, 375, 225, 0),
  row(null, null, 200, 120, 0),
] as const
