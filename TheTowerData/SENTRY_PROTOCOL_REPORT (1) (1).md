# The Tower — Sentry Protocol (Armor module, infoIndex 50)
### A reverse-engineering report

Reversed from `arm_apk/lib/armeabi-v7a-29.0.0/libil2cpp.so` (IL2CPP, **armeabi-v7a, 29.0.0**) with
`decomp29/dump.cs` for field offsets/signatures. **Sentry Protocol does not exist in the 28.3.0
arm64 binary** that `CLAUDE.md` describes — everything here is the 29.0.0 v7a build, where
`RVA == file offset == VA` for code (but **not** for `.data.rel.ro`/`.got`/`.data` — see §11).

The r2ghidra `pdg` plugin is ABI-stale against r2 6.2.0 in this workspace, so `tdec.py` returns
empty. **Every snippet below is raw ARM (A32) disassembly**, with `bl` targets resolved through
`decomp29/script.json` and string/metadata slots resolved through the GOT. One consequence worth
flagging up front: **r2 mis-prints VFP immediates** (it truncates `vmov.f32 sX, #imm` to an
integer). Two numbers in this report would have been wrong if taken from r2's text — they are
decoded from the raw `VFPExpandImm` encoding instead (§11, "the r2 immediate trap").

---

## 1. TL;DR

1. **Sentry Protocol is module `infoIndex = 50`**, `ModuleType.Armor`, base rarity `Epic`,
   `ModuleBenefitType.Normal`. Its `uniqueBenefit` array is **`{1, 2, 3, 4}`** — the "{0} mini
   orbs" in the description text. **1** at ≤Epic+, **2** at Legendary/Legendary+, **3** at
   Mythic/Mythic+, **4** at Ancestral and above.
2. **"Orb speed is reduced to zero" is literal, and it is three separate shutdowns**, not one:
   the workshop orb ring's `Rotate.rotateSpeed` is overwritten with `0`; the Extra-Orb card ring's
   `RotateInnerOrb.rotateSpeed` is overwritten with `0` every frame; **and the orb→enemy contact
   handler is skipped entirely**. Frozen orbs deal *no* touch damage even to an enemy standing on
   top of them. Both rings are also snapped to `localEulerAngles = Vector3.zero` and their motion
   particle systems are `Stop()`ed.
3. **Orb Speed is not wasted — it becomes the fire rate, linearly.** For workshop orbs the cooldown
   is `1 / (orbSpeed × 5)` seconds, i.e. **5 × orbSpeed volleys per game-second, per orb**. This
   *bypasses* the sigmoid/`pow(x, 0.62)` diminishing-returns curve that normally converts Orb Speed
   into ring rotation — under Sentry Protocol, Orb Speed is a **flat linear** rate stat.
4. **The Extra Orb (card) orbs are on a completely different formula**: cooldown
   `0.5 / (cardBenefit[ExtraOrb, level] + lab.researchBenefit[14])` → **2 × (card orb speed)
   volleys per game-second**, per card orb. Their count is `(int)lab.researchBenefit[73] + 1`.
   The 0.94/0.88 "extra orbs are slower" reducer from lab 73 **does not** apply to the fire rate —
   only to the (now-disabled) visual rotation.
5. **There is no catch-up.** The cooldown check is `now >= last + interval`, and on fire it does
   `last = now` (not `last += interval`). The check runs in `Main.Update`, i.e. **once per rendered
   frame**, so the real cap is
   `volleys per game-second ≤ min(5 × orbSpeed, FPS / Time.timeScale)`.
   At 60 FPS that means Orb Speed above **12 / (gameSpeed × speedFactor)** is thrown away — about
   **3.0 at 4× speed and 2.4 at 5× speed** (§6.3).
6. **Each orb fires at up to `numTargets` *different* enemies per volley** — one mini orb per
   target, not `numTargets` orbs at one enemy. Targets = the nearest `numTargets` `Targetable`
   enemies whose collider overlaps a **1.5-world-unit circle centred on that orb**
   (`SENTRY_PROTOCOL_RADIUS`, `Physics2D.OverlapCircle`, layer mask `"enemy" | "boss" | "Fleets"`).
   Orbs do **not** deduplicate against each other, so two orbs can both dump into the same enemy.
7. **Because the orbs are frozen, orb *placement* is now the whole coverage story.** A stationary
   orb guards one fixed 1.5-unit disc forever instead of sweeping a ring — so the Workshop Orb
   Distance / Extra Orb Distance sliders, and the number of orbs, decide what you actually cover.
8. **A mini orb is a real `Projectile` from a finite pool.** If `orbProjectilesPool` is empty the
   shot is **silently dropped** — no queue, no retry. Mini orbs home on their target at
   `min(fixedΔt × 2.5 × (1 + attackSpeed × 0.0625), 0.1)` world-units per physics tick, expire
   after **10 s**, and are consumed by the **first** enemy they touch.
9. **A mini-orb hit is exactly an orb hit** — it calls `Enemy.OrbHit()`, the same method a physical
   orb collision calls. So: it **instant-kills** ordinary enemies (after eating one point of
   `enemyArmor` per hit) unless the tournament **Orb Resistance** heat condition is on, in which
   case it deals `enemyHealthMax × resistanceLevel`; it only damages **Boss / ultimate
   Fast / ultimate Ranged / ultimate Tank** if the **"Orbs Boss Hit"** lab (research 18) is ≥ 1,
   for `enemyHealthMax × researchBenefit[18]`; and **`EnemyType` 6–12 (Vampire, ScatterMain,
   ScatterChild, Ray, Saboteur, Commander, Overcharge) plus `Protector` and anything `inProtector`
   take nothing at all.**
10. **Two free riders you may not have costed in.** Every mini-orb hit sets `markedByOrbs`, which
    is the flag `Enemy.OrbCoinBonus()` reads — so Sentry Protocol turns the "Coins From Orb"
    lab/mastery into a ranged, high-rate coin engine. And it stacks the **module 18** debuff
    (*"On Orb Hit: Reduces Enemy Damage & Speed by {0} (Stacking, Max 50%)"*), which is applied in
    `Enemy.OrbHit`'s tail and capped at `0.5`.
11. **Nothing else about the orb is preserved.** `Projectile.Activate` branches on
    `projectileType == Orb` *before* the entire tower-projectile damage block — mini orbs get **no**
    `damage` value, **no** crit/super-crit roll, **no** multishot, **no** rapid-fire trigger. They
    are a delivery mechanism for `OrbHit()` and nothing else.

---

## 2. Identity and the benefit values

### 2.1 The record

`ModuleManager.Initialize()` (`0x113DE18`) builds `modulesInfo` as an array of **16-byte inline
records** — `{ int type; int rarity; double[] uniqueBenefit; int benefitType; }` — so element *i*'s
`uniqueBenefit` field sits at array `+ 0x10 + i*16 + 8`. For *i* = 50 that is `0x338`:

```asm
; ---- modulesInfo[50] = Sentry Protocol,  ModuleManager.Initialize @ 0x113DE18 ----
0x0113ee3c   mov  r1, 1
0x0113ee40   str  r1, [sp, 0x40]        ; saved -> ModuleType = 1 (Armor)
0x0113ee44   mov  r1, 4                 ; new double[4]
0x0113ee4c   bl   <array new>
0x0113ee50   mov  r4, r0
0x0113ee68   bl   0x2c7b178             ; RuntimeHelpers$$InitializeArray(arr, <blob>)
0x0113ee7c   ldr  r4, [sp, 0x40]        ; = 1
0x0113ee88   ldr  r7, [sl]              ; = 4  (ModuleRarity.Epic)
0x0113ee9c   cmp  r0, 0x32              ; bounds: modulesInfo.Length > 50
0x0113eea8   str  r6, [r5, 0x338]!      ; modulesInfo[50].uniqueBenefit = arr   (0x10 + 50*16 + 8)
0x0113eeac   mov  r0, 0
0x0113eeb4   str  r0, [r5, 4]           ; benefitType = 0  (Normal)
0x0113eebc   str  r4, [r5, -8]          ; type   = 1  (Armor)
0x0113eec0   str  r7, [r5, -4]          ; rarity = 4  (Epic)
```

*(Cross-checked against `modulesInfo[52]` at `0x113FB5C`/`0x113FC00`, which reproduces the known
Tactical Barrage record — `type = 3 Core`, `rarity = 4 Epic`, `benefitType = 8 Time`.)*

### 2.2 The blob — `{1, 2, 3, 4}`

The `InitializeArray` handle resolves through the GOT to a `<PrivateImplementationDetails>` field
whose **name is the uppercase SHA-256 of its own bytes** (Roslyn's naming scheme), which makes the
value self-verifying:

```
0x113ee5c  got=0x3f43db8  slot=0x3ff40d8
           [META] 'Field$<PrivateImplementationDetails>.6BAB56D2F81D4B5A2DBF102BF6A6FF7D5211A475FC5F97813F977E8BA714B07D'
```

Scanning `global-metadata.dat` for the 32-byte window with that hash:

```
HIT at file offset 6749936  ->  struct.unpack("<4d") = (1.0, 2.0, 3.0, 4.0)
sha256 == 6BAB56D2F81D4B5A2DBF102BF6A6FF7D5211A475FC5F97813F977E8BA714B07D   ✔
```

*(Method validated first on module 52: offset 6778640 → `(14.0, 10.0, 6.0, 2.0)` →
`C92247820EB1…B5B6`, matching the field name exactly.)*

### 2.3 Rarity → tier → mini-orb count

`ModuleManager.GetUniqueBenefit(int infoIndex, ModuleRarity rarity)` @ `0x114C7D8`:

```asm
0x0114c7e4   mov  r1, 0
0x0114c7e8   cmp  r2, 5
0x0114c7f0   movwgt r1, 1               ; r1 = (rarity > 5)
0x0114c7f4   mov  r5, 2
0x0114c7f8   cmp  r2, 9
0x0114c7fc   movwhi r5, 3               ; r5 = (rarity > 9) ? 3 : 2
0x0114c800   cmp  r2, 8
0x0114c804   movlt  r5, r1              ; if (rarity < 8) r5 = r1
...
0x0114c830   add  r0, r6, r4, lsl 4     ; &modulesInfo[infoIndex]
0x0114c834   ldr  r4, [r0, 0x18]        ; .uniqueBenefit   (0x10 array data + 0x8 field)
0x0114c858   add  r0, r4, r5, lsl 3
0x0114c85c   vldr d8, [r0, 0x10]        ; return uniqueBenefit[tier]
```

| Rarity | value | tier | **mini orbs per orb per volley** |
|---|---:|---:|---:|
| None … Epic+ | 0–5 | 0 | **1** |
| Legendary, Legendary+ | 6–7 | 1 | **2** |
| Mythic, Mythic+ | 8–9 | 2 | **3** |
| Ancestral … Ancestral5 | 10–15 | 3 | **4** |

**Assist slot.** `TryGetUniqueBenefit` (`0x1164EA8`) scans `equipped[]` (`ModuleManager+0x50`)
first and uses the item's real rarity (`ModuleItem+0xC`); failing that it scans the assist slots
(`+0x10C`) and synthesises a rarity from the slot's unique-effect efficiency level:

```asm
0x011652e4   mov  r0, 0xa               ; default effective rarity = 10 (Ancestral)
0x011652e8   cmp  r1, 3                 ; efficiency level
0x011652ec   mov  r2, 4
0x011652f0   addlo r0, r2, r1, lsl 1    ; level<3 -> rarity = 4 + level*2
```

so an assist-slotted Sentry Protocol at efficiency **0 / 1 / 2 / 3** gives effective rarity
**4 / 6 / 8 / 10** → **1 / 2 / 3 / 4** mini orbs. (`ASSIST_MODULE_UNIQUE_EFFECT_EFFICIENCY_MAX_LEVEL = 3`.)

The description string is localization term **3690**:
*"Orb speed is reduced to zero. Orbs instead fire {0} mini orbs."*

---

## 3. What it does to the orbs

Three independent kill switches. All three key off the same
`ModuleManager.TryGetUniqueBenefit(0x32, …)` probe.

### 3.1 Workshop ring: `rotateSpeed := 0` — `Main.OrbCheck()` @ `0x10674E4`

Everything at `0x10676EC…0x1067818` computes the *normal* rotation speed — and then it is thrown
away:

```asm
0x01067854   add  r2, sp, 0x28
0x01067858   mov  r0, r5                ; ModuleManager.Instance
0x0106785c   mov  r1, 0x32              ; infoIndex 50 = Sentry Protocol
0x01067868   bl   0x1164ea8             ; ModuleManager$$TryGetUniqueBenefit
0x0106786c   vldr s0, [0x1067944]       ; 0.0f
0x01067870   cmp  r0, 0
0x01067874   ldr  r5, [sb, 0x248]       ; this->orbSpeedScript   (Rotate)
0x01067878   mov  r7, r0                ; keep the flag
0x0106787c   vmovne.f32 s16, s0         ; EQUIPPED -> rotateSpeed := 0
0x0106788c   vstr s16, [r5, 0x10]       ; Rotate.rotateSpeed = s16
```

and `Rotate.Update()` (`0x127D578`) bails on exactly that:

```asm
0x0127d658   vldr s0, [r4, 0x10]        ; rotateSpeed
0x0127d65c   vcmp.f32 s0, 0
0x0127d664   beq  0x127d774             ; == 0 -> return, no Transform.Rotate at all
```

Still inside `OrbCheck`, the same flag stops the trail VFX and snaps both rings home:

```asm
0x010678b0   cmp  r7, 0                 ; hasSentryProtocol
0x010678b4   beq  0x10678f8
0x010678f0   bl   0x1ed5a6c             ; ParticleSystem.Stop()   on orbMovementParticles[i]
   ; (else branch @0x1067930 -> ParticleSystem.Play())

0x01067fa4   cmp  r7, 0
0x01067fa8   beq  0x10686d0
0x01067fac   ldr  r5, [sb, 0x248]       ; orbSpeedScript.transform
0x0106802c   bl   0x1ed57c4             ; Transform.set_localEulerAngles( Vector3.zero )
0x01068040   ldr  r5, [r5, 0x2c4]       ; cards.cardOrbScript.transform  -> same call
```

*(The `Vector3` argument is `Vector3_TypeInfo -> static_fields[0]` = `Vector3.zero`.)*

`OrbCheck` is event-driven, not per-frame — callers are `Main.CalculateUpgradeBonuses` (×2),
`Main.StartNewRound` (×2), `Main.GameSpeedModifier`, and `Cards.CalculateBenefits`. It fires at
round start and on every stat recalculation, which is more than enough.

### 3.2 Extra Orb (card) ring: `rotateSpeed := 0` — `RotateInnerOrb.Update()` @ `0x127D934`

This one is checked **every frame**:

```asm
0x0127db04   mov  r1, 0x32              ; infoIndex 50
0x0127db0c   bl   0x1164ea8             ; TryGetUniqueBenefit
0x0127db10   cmp  r0, 0
0x0127db14   beq  0x127db30             ; not equipped -> normal path
0x0127db24   mov  r0, 0
0x0127db28   str  r0, [r4, 0x1c]        ; this->rotateSpeed = 0
0x0127db2c   b    0x127dc5c             ; and return - no Rotate()
```

The normal path it replaces (worth having, since it is the same quantity the fire rate uses):

```asm
0x0127db74   ldr  r6, [r6, 0x50]        ; cards.cardLevel[16]        (0x10 + 16*4)
0x0127dbbc   vldr s16, [r0, 0x10]       ; cards.cardBenefit[16, cardLevel[16]]
0x0127dbe8   vldr s0,  [r5, 0x48]       ; lab.researchBenefit[14]    (0x10 + 14*4)
0x0127dbec   vldr s2,  [r4, 0x38]       ; this->orbSpeedReducer
0x0127dbf0   vadd.f32 s0, s16, s0
0x0127dbf4   vmul.f32 s0, s0, s2
0x0127dbfc   vstr s0, [r4, 0x1c]        ; rotateSpeed = (cardBenefit + labBenefit) * reducer
0x0127dc68   bl   0x1ed59a0             ; Transform.Rotate(0, 0, rotateSpeed * dt * 60)
```

`orbSpeedReducer` comes from `OrbCheck` and is a function of the **lab-73** level
("Extra Extra Orbs"):

```asm
0x01067e4c   ldr  r4, [r4, 0x134]       ; lab.researchLevel[73]
0x01067e50   vmov.f32 s16, 1            ; IMM = 1.0
0x01067e58   cmp  r4, 1
0x01067e60   vmoveq.f32 s16, s0         ; s0 = 0.94
0x01067e68   cmp  r4, 2
0x01067e6c   vmoveq.f32 s16, s0         ; s0 = 0.88
0x01067e98   bl   0x127dc98             ; RotateInnerOrb$$CheckOrbs(s16)
```

**Note this reducer is applied only to the rotation** — it is absent from
`GetSentryProtocolCardOrbsAttackSpeed` (§4.2). More extra orbs therefore does **not** slow the
sentry fire rate.

### 3.3 Contact damage: disabled outright — `Enemy.OnTriggerEnter2D()` @ `0x1500A70`

This is the one most likely to be missed. The orbs still exist, are still active, still have their
colliders — but the collision handler refuses to process them:

```asm
0x01500d88   bl   0x1ed5a28             ; GameObject.CompareTag(other.gameObject, "orb")
0x01500d8c   cmp  r0, 0
0x01500d90   beq  0x1500e14             ; not an orb -> next tag test ("DeathRay", ...)
0x01500dd0   mov  r1, 0x32              ; infoIndex 50 = Sentry Protocol
0x01500dd8   bl   0x1164ea8             ; TryGetUniqueBenefit
0x01500ddc   cmp  r0, 0
0x01500de0   bne  0x1500e14             ; EQUIPPED -> skip the whole orb-hit handler
0x01500dfc   vmov.f32 s0, 1             ; IMM = 1.0
0x01500e04   vldr s2, [r0, 4]           ; Main.gameSpeed  (static field @ +4)
0x01500e08   vcmp.f32 s2, s0
0x01500e10   bge  0x150130c             ; (normal path) only when gameSpeed >= 1
```

*(The `"orb"` string was resolved through the GOT slot at `0x3f4a748 -> 0x40069e0`, ScriptString
`'orb'`; the next tag in the chain is `'DeathRay'`.)*

So under Sentry Protocol an orb parked on top of a Basic enemy does **nothing**. All orb output now
flows exclusively through the mini orbs.

---

## 4. Rate of fire

### 4.1 The per-frame driver — `Main.Update()` @ `0x1057940`

Immediately after `TowerFireFunction`:

```asm
0x010580c0   add  r2, sp, 0x20
0x010580c4   mov  r0, r5                ; ModuleManager.Instance
0x010580c8   mov  r1, 0x32              ; infoIndex 50
0x010580d0   bl   0x1164ea8             ; TryGetUniqueBenefit(50, out benefit)
0x010580d4   cmp  r0, 0
0x010580d8   beq  0x1058148             ; not equipped -> skip
0x010580dc   ldr  r0, [r4, 0x37c]       ; this->orbCount
0x010580e0   cmp  r0, 0
0x010580e4   bgt  0x1058124             ; any workshop orbs -> go
0x010580f8   ldr  r5, [r5, 0x40]        ; cards.cardActive
0x01058118   ldrb r0, [r5, 0x20]        ; cardActive[16]  (CardID.InnerOrb = "Extra Orb")
0x01058120   beq  0x1058148             ; neither -> skip
0x01058124   vldr d16, [sp, 0x20]       ; benefit (double)
0x01058130   vcvt.s32.f64 s0, d16       ; (int)benefit
0x0105813c   vmov r1, s0
0x01058144   bl   0x10565b4             ; Main$$SentryProtocolUpdate(numTargets = (int)benefit)
```

`numTargets` is recomputed from the module every single frame; nothing is cached.

### 4.2 The two cooldown formulas

**Workshop orbs** — `Main.GetSentryProtocolWorkshopOrbsAttackSpeed()` @ `0x1055BB8`, seven
instructions, and inlined verbatim into `SentryProtocolUpdate` at `0x1056698`:

```asm
0x01055bb8   vmov.f32 s0, 5             ; IMM = 5.0   (raw imm8 = 0x14 -> VFPExpandImm = 5.0)
0x01055bbc   vldr s2, [r0, 0x378]       ; this->orbSpeed
0x01055bc0   vmov.f32 s4, 1             ; IMM = 1.0
0x01055bc4   vmul.f32 s0, s2, s0        ; orbSpeed * 5
0x01055bc8   vdiv.f32 s0, s4, s0        ; 1 / (orbSpeed * 5)
0x01055bcc   vmov r0, s0
0x01055bd0   bx   lr
```

> **cooldown = 1 / (orbSpeed × 5) game-seconds → 5 × orbSpeed volleys/game-second per orb**

**Extra Orb (card) orbs** — `Main.GetSentryProtocolCardOrbsAttackSpeed()` @ `0x1055BD4`:

```asm
0x01055c24   ldr  r6, [r6, 0x50]        ; cards.cardLevel[16]
0x01055c6c   vldr s16, [r0, 0x10]       ; cards.cardBenefit[16, cardLevel[16]]
0x01055c98   vldr s0,  [r4, 0x48]       ; lab.researchBenefit[14]
0x01055c9c   vmov.f32 s2, 1             ; IMM = 1.0
0x01055ca0   vadd.f32 s0, s16, s0
0x01055ca4   vdiv.f32 s0, s2, s0        ; 1 / (cardBenefit + labBenefit)
0x01055ca8   vmov.f32 s2, 5             ; IMM = 0.5   <-- r2 prints "5"; the encoding is 0.5
0x01055cac   vmul.f32 s0, s0, s2
```

> **cooldown = 0.5 / (cardBenefit[ExtraOrb, level] + lab.researchBenefit[14]) game-seconds
> → 2 × (card orb speed) volleys/game-second per card orb**

The two rings are on genuinely different scales because the two "speed" stats are different
quantities: `Main.orbSpeed` is the Workshop Orb Speed stat, while the card figure is the Extra Orb
card's *rotation* speed (in degrees per 1/60 s — `Rotate(0,0, speed × dt × 60)`).

### 4.3 The loop — `Main.SentryProtocolUpdate(int numTargets)` @ `0x10565B4`

```asm
0x01056630   ldr  r0, [sp, 0x10]        ; numTargets
0x01056634   cmp  r0, 1
0x01056638   blt  0x1056b18             ; < 1 -> nothing to do

; ---------------- workshop orbs ----------------
0x0105663c   movw r0, 0x10e0
0x01056640   add  sb, sl, r0            ; &this->sentryProtocolLastWorkshopOrbsAttack
0x01056644   vldr s16, [sl, 0x378]      ; orbSpeed
0x01056698   vmov.f32 s0, 5             ; IMM = 5.0
0x0105669c   ldr  r1, [sl, 0x37c]       ; orbCount
0x010566a0   vmov.f32 s2, 1             ; IMM = 1.0
0x010566a4   ldr  r5, [r0, 0xc]         ; list.Count
0x010566a8   vmul.f32 s0, s16, s0
0x010566ac   vdiv.f32 s16, s2, s0       ; s16 = interval = 1/(orbSpeed*5)
0x010566b0   cmp  r5, r1
0x010566b4   bge  0x105674c
   ; --- grow the per-orb timestamp list to orbCount, seeded so new orbs can fire immediately
0x010566c0   bl   0x1ed5708             ; Time.get_time()
0x01056708   vsub.f32 s0, s0, s16       ; now - interval
   ;     ... List<float>.Add(now - interval) ...

0x0105674c   cmp  r1, 1                 ; orbCount >= 1 ?
0x01056750   blt  0x1056864
0x0105676c   mov  r0, 0
0x01056770   bl   0x1ed5708             ; now = Time.time            (per orb!)
0x01056798   bl   0x28bc4d8             ; last = list[i]
0x010567a0   vadd.f32 s0, s16, s0       ; last + interval
0x010567a4   vcmp.f32 s18, s0           ; now  vs  last + interval
0x010567ac   blt  0x1056854             ; not ready -> next orb
0x010567b0   ldr  r4, [sl, 0x238]       ; this->orbSprites
0x010567ec   bl   0x1ed5630             ; .transform
0x0105680c   bl   0x1ed566c             ; .position
0x01056820   bl   0x1055cc0             ; Main$$SentryProtocolFire(orbPos, numTargets)
0x01056850   bl   0x28bc524             ; list[i] = now      <-- assignment, NOT += interval
0x01056854   ldr  r0, [sl, 0x37c]
0x01056860   blt  0x105676c             ; for (i = 0; i < orbCount; i++)

; ---------------- Extra Orb (card) orbs ----------------
0x01056868   bl   0x1055bd4             ; GetSentryProtocolCardOrbsAttackSpeed()  -> interval
0x01056880   ldr  r5, [r5, 0x12c]       ; lab.researchBenefit
0x010568a0   vldr s0, [r5, 0x134]       ; researchBenefit[73]        (0x10 + 73*4)
0x010568a8   vcvt.s32.f32 s4, s0
0x010568ac   ldr  r0, [sb, 4]!          ; &this->sentryProtocolLastCardOrbsAttack (0x10E4)
0x010568c0   add  r6, r1, 1             ; cardOrbCount = (int)researchBenefit[73] + 1
   ; ... same grow-then-scan loop, but each iteration additionally checks:
0x01056a30   ldr  r4, [r4, 0x40]        ; cards.cardActive
0x01056a50   ldrb r0, [r4, 0x20]        ; cardActive[16]  (Extra Orb)
0x01056a58   beq  0x1056b0c             ; card off -> skip
0x01056a6c   ldr  r4, [r4, 0x2c4]       ; cards.cardOrbScript      (RotateInnerOrb)
0x01056a7c   ldr  r4, [r4, 0x24]        ; .orbs  (Transform[])
0x01056abc   bl   0x1ed566c             ; orbs[i].position
0x01056ad0   bl   0x1055cc0             ; Main$$SentryProtocolFire(orbPos, numTargets)
```

Reconstructed:

```csharp
void SentryProtocolUpdate(int numTargets) {
    if (numTargets < 1) return;
    float now, interval;

    // --- workshop orbs -----------------------------------------------------
    interval = 1f / (orbSpeed * 5f);
    while (lastWorkshop.Count < orbCount) lastWorkshop.Add(Time.time - interval);
    for (int i = 0; i < orbCount; i++) {
        now = Time.time;
        if (now < lastWorkshop[i] + interval) continue;
        SentryProtocolFire(orbSprites[i].transform.position, numTargets);
        lastWorkshop[i] = Time.time;              // no carry-over
    }

    // --- Extra Orb card orbs ----------------------------------------------
    interval = GetSentryProtocolCardOrbsAttackSpeed();     // 0.5 / (cardSpeed + lab14)
    int n = (int)lab.researchBenefit[73] + 1;
    while (lastCard.Count < n) lastCard.Add(Time.time - interval);
    for (int i = 0; i < n; i++) {
        now = Time.time;
        if (now < lastCard[i] + interval) continue;
        if (!cards.cardActive[CardID.InnerOrb]) continue;
        SentryProtocolFire(cards.cardOrbScript.orbs[i].position, numTargets);
        lastCard[i] = Time.time;
    }
}
```

**Consequences of `last[i] = now` rather than `last[i] += interval`:**

* No debt is carried. A volley missed because the frame was late is simply gone.
* Every orb has an **independent** timer, so they naturally de-phase.
* `Time.time` is *scaled* time, so the rate is constant per **game**-second regardless of game
  speed — but `Main.Update` runs once per **rendered frame**, and game time advances
  `Time.timeScale / FPS` per frame. So:

> **volleys per game-second = min( 5 × orbSpeed , FPS / Time.timeScale )**

`Time.timeScale` is set by `Main.GameSpeedModifier()` (`0x10603C4`) as
`gameSpeed × f(gameSpeed)`, with the factor ladder read from the literal pool at `0x10605E8`:

| gameSpeed | ≥5 | ≥4.5 | ≥4 | ≥3.5 | ≥3 | ≥2.5 | ≥2 | ≥1 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| factor | 0.80 | 0.82 | 0.84 | 0.88 | 0.92 | 0.95 | **1.00** | 1.07 |

so effective `timeScale` at the 1×…5× settings is ≈ 1.07, 2.00, 2.76, 3.36, 4.00. The Orb Speed
above which volleys are being thrown away, at 60 FPS:

| game speed | timeScale | frame cap (volleys/game-s) | **Orb Speed saturation point** |
|---|---:|---:|---:|
| 1× | 1.07 | 56.1 | 11.2 |
| 2× | 2.00 | 30.0 | 6.0 |
| 3× | 2.76 | 21.7 | 4.3 |
| 4× | 3.36 | 17.9 | 3.6 |
| 5× | 4.00 | 15.0 | **3.0** |

At 30 FPS halve every number in the last two columns.

---

## 5. Targeting — `Main.SentryProtocolFire(Vector3 orbPosition, int numTargets)` @ `0x1055CC0`

### 5.1 The overlap query

The layer mask and contact filter are built once, lazily:

```asm
0x01055d7c   mov  r1, 3                 ; new string[3]
0x01055da4   ; arr[0] = "enemy"
0x01055ddc   ; arr[1] = "boss"
0x01055e0c   ; arr[2] = "Fleets"
0x01055e34   bl   0x1ed5a38             ; LayerMask.GetMask(string[])
0x01055e44   str  r1, [r8, 4]           ; this->sentryProtocolLayerMask   (0x10EC)
0x01055eb0   bl   0xf02e08              ; ContactFilter2D.NoFilter()  (0x1C bytes @ 0x10F0)
0x01055ecc   bl   0x1ed5a40             ; ContactFilter2D.SetLayerMask(mask)
```

*(The three strings resolve through the GOT to ScriptString `'enemy'`, `'boss'`, `'Fleets'`.)*

Then, per volley:

```asm
0x01055f48   mov  r1, sb                ; orbPosition.y
0x01055f4c   mov  r2, 0x3fc00000        ; 1.5f  == SENTRY_PROTOCOL_RADIUS
0x01055f54   mov  r0, sl                ; orbPosition.x
0x01055f6c   bl   0x1ed5a44             ; Physics2D.OverlapCircle(point, 1.5f, filter, hits)

0x01055f74   ldr  r0, [r7, 0x14]        ; this->sentryProtocolClosest   (0x110C)
0x01055f80   ldr  r2, [sp, 0x68]        ; numTargets
0x01055f94   bl   0x1056058             ; Main$$UpdateClosestEnemiesToPoint(orbPos, numTargets,
                                        ;                                  closest, hits)
0x01055fe0   bl   0x2961100             ; entry = closest[i]
0x01055ffc   bl   0x105651c             ; Main$$OrbFire(orbPos, entry.enemyIndex)
0x01056000   add  r4, r4, 1             ; for every entry in `closest`
```

`SENTRY_PROTOCOL_RADIUS` is also declared as a literal const in `dump.cs`:
`private const float SENTRY_PROTOCOL_RADIUS = 1.5;`

### 5.2 The candidate filter — `Main.UpdateClosestEnemiesToPoint` @ `0x1056058`

```asm
0x01056188   bl   0x18076c8             ; collider.TryGetComponent<Enemy>(out e)
0x01056190   beq  0x10564a4             ; no Enemy component -> skip
0x010561ac   bl   0x14e2970             ; Enemy.get_Targetable
0x010561b4   beq  0x10564a4             ; not targetable -> skip
0x010561f0   bl   0x1ed566c             ; e.transform.position
0x01056254   vsub.f32 s0, s22, s18      ; dy
0x0105625c   vsub.f32 s2, s20, s16      ; dx
0x01056264   vmul.f32 s0, s0, s0
0x01056268   vmla.f32 s0, s2, s2
0x0105626c   vsqrt.f32 s20, s0          ; 2-D distance (z ignored)
   ; insertion-sort into `listToUpdate` by ascending distance, kept at <= count entries
0x010562ec   bl   0x10a8bb4             ; new ClosestEnemyEntry(e.number, dist)
```

`Enemy.get_Targetable` (`0x14E2970`) = `gameObject.activeInHierarchy && <collider enabled>
&& enemyHealth > 0 && !_isDying && !_deactivateQueued`.

So: **the `numTargets` closest live enemies inside a 1.5-unit circle centred on the orb, in
ascending distance order, one mini orb each.** No tower-range check is involved anywhere — the
tower's `maxDistance` is irrelevant to Sentry Protocol; the orb's own position is the origin.

There is **no cross-orb deduplication**: `sentryProtocolClosest` is cleared at the start of every
`UpdateClosestEnemiesToPoint` call, so each orb independently picks its own nearest N. With a
single enemy in range of several orbs, every one of those orbs fires at it.

---

## 6. The mini orb itself

### 6.1 Spawn — `Main.OrbFire` @ `0x105651C` and `Main.TryGetOrbProjectile` @ `0x10570C4`

```asm
; OrbFire(Vector3 sourcePosition, int selectedTarget)
0x01056544   bl   0x10570c4             ; TryGetOrbProjectile(out p)
0x01056548   cmp  r0, 0
0x0105654c   beq  0x10565ac             ; POOL EMPTY -> return, shot silently dropped
0x01056550   ldr  r4, [r4, 0x4d4]       ; this->enemy   (Enemy[])
0x01056578   add  r0, r4, sb, lsl 2
0x01056580   ldr  r4, [r0, 0x10]        ; enemy[selectedTarget]
0x010565a8   bl   0x11fd12c             ; Projectile.Activate(sourcePosition, enemy)

; TryGetOrbProjectile(out Projectile p)
0x01057104   movw r0, 0x1084
0x01057108   ldr  r5, [r6, r0]!         ; this->orbProjectilesPool   (Queue<Projectile>)
0x01057118   ldr  r5, [r5, 0x14]        ; _size
0x01057120   beq  0x1057150             ; empty -> p = null
0x01057144   bl   0x1c589b0             ; Queue.Dequeue()
0x01057164   movwne r5, 1
0x01057168   mov  r0, r5                ; return (_size != 0)
```

The pool is filled once, in `Main.Awake` (`0x1033CA8`), from the scene-serialized
`Main.orbProjectiles` array:

```asm
0x010346fc   ldr  r6, [sl, 0x470]       ; this->orbProjectiles
0x01034714   ldr  r1, [r6, 0xc]         ; .Length
0x01034720   bl   0x1c5828c             ; new Queue<Projectile>(Length)
0x0103472c   str  r5, [r6, 0x2c]!       ; this->orbProjectilesPool = queue
0x0103479c   bl   0x1c587f4             ; Enqueue(orbProjectiles[i])   for every i
```

and refilled by `Projectile.Deactivate()` (`0x11FC960`), which routes by type:

```asm
0x011fc9f8   ldr  r0, [r4, 0x30]        ; projectileType
0x011fc9fc   cmp  r0, 1                 ; ProjectileType.Orb
0x011fcaf8   movw r0, 0x1084            ; -> orbProjectilesPool.Enqueue(this)
                                        ;    (else -> projectilesPool @0x1080)
```

**The pool size is the length of a Unity-inspector array and is not present in the binary** — see
§10. This is a hard concurrency cap: at 4 orbs × 4 mini orbs × several volleys per second, with a
homing flight time, it is not obviously generous.

### 6.2 Activation is *not* the tower-projectile path — `Projectile.Activate` @ `0x11FD12C`

```asm
0x011fd1f4   str  r5, [r4, 0x10]!       ; this->target = enemyTarget
0x011fd210   bl   0x1ed5708             ; Time.time
0x011fd214   vmov.f32 s0, 1             ; IMM = 10.0   <-- r2 prints "1"; the encoding is 10.0
0x011fd224   vadd.f32 s0, s2, s0
0x011fd228   vstr s0, [r4, 0x14]        ; maxActiveTime = Time.time + 10
0x011fd21c   ldr  r0, [r4, 0x20]        ; this->projectileType   (fp + 0x30)
0x011fd220   cmp  r0, 1                 ; ProjectileType.Orb
0x011fd22c   bne  0x11fd2a4             ; NOT an orb -> full tower path below
   ; ---- orb path: position + activate, then RETURN ----
0x011fd23c   bl   0x1ed5630             ; transform
0x011fd264   bl   0x1ed5740             ; transform.set_position(sourcePosition)
0x011fd28c   mov  r1, 1
0x011fd2a0   b    0x1ed57c8             ; gameObject.SetActive(true)   [tail call]
   ; ---- 0x11fd2a4 onward (SKIPPED for orbs): SuperTower mult, Demon mult, IsCriticalHit,
   ;      IsSuperCriticalHit, damage assignment, MarkForDeath, MultishotBullet, RapidFireStart
```

That single `cmp r0, 1 / bne` is why a mini orb carries **no damage number, no crit, no multishot
and no rapid-fire trigger**. It exists purely to deliver `OrbHit()`.

### 6.3 Flight — `Projectile.ProjectileMovement(float)` @ `0x11FC68C`

Driven from `Main.FixedUpdate` (`0x1057574`), which walks `orbProjectiles[]` and calls it with
`Time.fixedDeltaTime` for every projectile whose GameObject is active:

```asm
0x011fc760   bl   0x1ed57ec             ; target.gameObject.activeSelf
0x011fc768   beq  0x11fc924             ; target gone -> Deactivate()
0x011fc77c   vmov.f32 s0, 2             ; IMM = 2.5   (== Projectile.BASE_SPEED)
0x011fc780   vldr s4, [0x11fc938]       ; 0.0625f
0x011fc788   vldr s6, [r7, 0x2d8]       ; Main.attackSpeed
0x011fc794   vmul.f32 s0, s16, s0       ; dt * 2.5
0x011fc798   vldr s16, [0x11fc93c]      ; 0.1f
0x011fc79c   vmla.f32 s2, s6, s4        ; 1 + attackSpeed * 0.0625
0x011fc7a0   vmul.f32 s0, s0, s2
0x011fc7a4   vcmp.f32 s0, s16
0x011fc7ac   vmovmi.f32 s16, s0         ; step = min(that, 0.1)
   ; ... move `step` along the unit vector toward the target, snapping if within `step` ...
0x011fc8f4   bl   0x1ed5740             ; transform.set_position(x, y, 0)
0x011fc8fc   bl   0x1ed5708             ; Time.time
0x011fc908   vcmp.f32 s2, s0            ; now vs maxActiveTime
0x011fc914   blgt 0x11fc960             ; expired -> Deactivate()
```

So mini-orb travel speed **scales with your tower Attack Speed** (+6.25 % of the stat), capped at
`0.1` world-units per physics tick, and the projectile self-destructs after 10 s or as soon as its
target despawns.

### 6.4 Impact — `Projectile.OnTriggerEnter2D` @ `0x11FCB50`

```asm
0x011fcc54   ldr  r0, [r4, 0x30]        ; projectileType
0x011fcc58   cmp  r0, 1
0x011fcc5c   beq  0x11fcc78             ; Orb
0x011fcc60   cmp  r0, 0
0x011fcc70   bl   0x11fccb8             ; Tower -> Projectile.ProjectileHit(enemy)
0x011fcc78:
0x011fcc8c   bl   0x150432c             ; Orb  -> Enemy.OrbHit()
0x011fcc98   b    0x11fcf3c             ; then RequestSafeDeactivate()  (both paths)
```

**One enemy per mini orb.** No pierce, no bounce.

*(`Projectile.OrbProjectileHit` @ `0x11FCF18` also exists and is a 0x24-byte tail call straight to
`Enemy.OrbHit` — same effect, reached from the other collision path.)*

---

## 7. What a mini-orb hit does — `Enemy.OrbHit()` @ `0x150432C`

This is the *existing* orb-hit method, unchanged by the module. Reconstructed from the
disassembly:

```csharp
void OrbHit() {
    markedByOrbs = true;                                   // 0x16C  <- coin-bonus flag

    bool elite = enemyType == EnemyType.Boss
              || IsUltimateFast || IsUltimateRanged
              || (IsUltimateTank && Main.Instance.isTankUltimateOn);

    if (elite) {
        if (lab.researchLevel[18] < 1) goto tail;          // "Orbs Boss Hit" not researched
        OrbDamage(enemyHealthMax * lab.researchBenefit[18]);
        if (!alreadyHitByOrb) { alreadyHitByOrb = true; Main.orbHitsThisRound += 1; }
    } else {
        if ((uint)(enemyType - 6) < 7u) goto tail;         // 6..12 -> completely immune
        if (CustomizeGame.Instance.heatLevel[0] != 0) {
            float res = CustomizeGame.Instance.GetResistanceLevel(0, -1);
            if (inProtector || enemyType == EnemyType.Protector) goto tail;
            OrbDamage(enemyHealthMax * res);               // "Orb Resistance" heat condition
        } else {
            if (inProtector || enemyType == EnemyType.Protector) goto tail;
            if (enemyArmor >= 1) { enemyArmor--; /* hit text */ }
            else Kill(DamageSource.Orb, false, false);     // INSTANT KILL
        }
        if (!alreadyHitByOrb) { alreadyHitByOrb = true; Main.orbHitsThisRound += 1; }
    }

tail:
    if (enemyHealth > 0 && gameObject.activeInHierarchy
        && ModuleManager.Instance.TryGetUniqueBenefit(18, out double b))
        magicOrbDebuff = Mathf.Min(magicOrbDebuff + (float)b, 0.5f);
}
```

Key snippets:

```asm
0x015043f4   ldr  r1, [r4, 0x30]        ; enemyType
0x01504400   cmp  r1, 3                 ; Boss
0x01504404   strb r0, [r4, 0x16c]       ; markedByOrbs = true   (r0 = 1)
0x01504410   bl   0x14e253c             ; get_IsUltimateTank
0x01504428   ldrb r0, [r6, 0xf30]       ;   && Main.isTankUltimateOn
0x0150443c   bl   0x14e25f4             ; get_IsUltimateFast
0x0150444c   bl   0x14e2484             ; get_IsUltimateRanged

; --- elite path ---
0x0150449c   ldr  r0, [r7, 0x58]        ; lab.researchLevel[18]      (0x10 + 18*4)
0x015044a4   blt  0x1504650             ; level < 1 -> no damage at all
0x015044a8   vldr d8, [r4, 0x58]        ; enemyHealthMax
0x015044e8   vldr s0, [r7, 0x58]        ; lab.researchBenefit[18]
0x015044f4   vmul.f64 d16, d8, d16
0x015044fc   bl   0x14f3388             ; Enemy$$OrbDamage

; --- normal path ---
0x01504534   ldr  r0, [r4, 0x30]
0x01504538   sub  r0, r0, 6
0x0150453c   cmp  r0, 7
0x01504540   blo  0x1504650             ; enemyType 6..12 -> return, nothing happens
0x01504598   ldr  r0, [r7, 0x10]        ; CustomizeGame.heatLevel[0]
0x0150459c   cmp  r0, 0
0x015045a0   beq  0x1504710             ; heat off -> instant-kill regime
0x015045e0   bl   0x14adac8             ; CustomizeGame$$GetResistanceLevel(0, -1)
0x01504614   bl   0x14f3388             ; OrbDamage(enemyHealthMax * res)

0x01504728   ldr  r0, [r4, 0x94]        ; enemyArmor
0x0150472c   cmp  r0, 1
0x01504740   str  r0, [r4, 0x94]        ; armor--
0x01504790   mov  r1, 2                 ; DamageSource.Orb
0x0150479c   bl   0x14eec08             ; Enemy$$Kill

; --- tail: module 18 debuff ---
0x015046cc   mov  r1, 0x12              ; infoIndex 18
0x015046d4   bl   0x1164ea8             ; TryGetUniqueBenefit
0x015046e4   vmov.f32 s4, 5             ; IMM = 0.5   <-- the "Max 50%" cap
0x015046e8   vldr s2, [r4, 0x168]       ; magicOrbDebuff
0x015046f0   vadd.f32 s0, s2, s0
0x015046fc   vmovgt.f32 s0, s4          ; clamp to 0.5
0x01504700   vstr s0, [r4, 0x168]
```

The localization corroborates every branch exactly:

* research 18 → **"Orbs Boss Hit"** — *"Orbs will be able to hit bosses by a percentage of boss health"*
* heat condition 0 → **"Orb Resistance"** — *"Instead of destroying enemies, orbs deal {0} enemy health as damage"*
* module 18 → *"On Orb Hit: Reduces Enemy Damage & Speed by {0} (Stacking, Max 50%)"*
* `markedByOrbs` consumer → *"Enemies hit by orbs drop bonus coins"* / **"Coins From Orb"**

`Enemy.OrbCoinBonus()` (`0x14F8A30`) opens with exactly that flag:

```asm
0x014f8b24   ldrb r0, [r4, 0x16c]       ; markedByOrbs
0x014f8b28   vmov.f64 d8, 1             ; IMM = 1.0  (default multiplier)
0x014f8b30   cmp  r0, 0
0x014f8b34   ldrbeq r0, [r4, 0x208]     ; else: gilded  (Gilded Sniper, module 51)
0x014f8b3c   beq  0x14f8bec             ; neither -> return 1.0
```

---

## 8. Consequences worth naming

* **Orb Speed changes character completely.** Vanilla, it feeds a saturating curve (§9) and its
  only job is how fast the ring sweeps. Under Sentry Protocol it is a **linear** attacks-per-second
  stat with a hard frame-rate ceiling. Every point is worth the same until you hit
  `FPS / timeScale / 5`, and then it is worth **nothing**.
* **Orb Count is now a pure multiplier on DPS *and* on coverage** — each orb is an independent
  turret with its own timer and its own 1.5-unit disc.
* **Orb placement became a real decision.** Frozen orbs guard fixed points. The Workshop Orb
  Distance / Extra Orbs Distance sliders now determine which lane radius you cover, and gaps
  between orbs are permanent instead of being swept.
* **Never bring it for Fleet/elite waves.** `enemyType` 6–12 — Vampire, ScatterMain, ScatterChild,
  Ray, Saboteur, Commander, Overcharge — take literally nothing, and with contact damage disabled
  you also lose whatever the physical orbs would have done to the basics around them (which was,
  admittedly, also nothing for those types).
* **Bosses require the "Orbs Boss Hit" lab.** Without research 18 the module contributes zero
  boss damage; with it, every mini orb is another `enemyHealthMax × benefit` tick, and the volume
  is far higher than a rotating orb could ever achieve.
* **In tournaments with Orb Resistance, the module is a %-max-HP machine gun** rather than an
  instant-kill machine gun — arguably its best case, since the volume scales the percentage.
* **Module 18 synergy is strong**: the debuff stacks *per orb hit* and Sentry Protocol multiplies
  orb hits by roughly an order of magnitude, so the 50 % cap is reached almost immediately on
  anything that survives.
* **Attack Speed has a hidden second job** — it is the only thing that makes mini orbs travel
  faster (`+6.25 %` of the stat, capped at `0.1`/tick). Slow projectiles at high fire rate will
  exhaust the pool.
* **Watch the pool.** `TryGetOrbProjectile` returning false is a silent no-op. High orb count ×
  high rarity × high orb speed is exactly the configuration that starves it.

---

## 9. Sidebar — what Orb Speed does *without* the module

For contrast, the discarded computation in `OrbCheck` (`0x10676EC…0x1067818`), fully decoded:

```asm
0x010676c8   vldr s18, [sb, 0x378]      ; orbSpeed
0x010676cc   ldr  r0,  [sb, 0x37c]      ; orbCount
0x010676e4   vmov.f32 s16, 1            ; if (orbSpeed != 0 && orbCount < 1) -> rotateSpeed = 1
0x010676f0   vldr s22, [0x1067940]      ; -1.2f
0x010676f4   vcvt.f32.s32 s16, s0       ; n = (float)orbCount
0x010676f8   vmov.f32 s0, -8            ; IMM = -8.0
0x010676fc   vmla.f32 s22, s18, s16     ; x = orbSpeed*n - 1.2
0x01067700   vmul.f32 s0, s22, s0       ; -8x
0x01067708   bl   0x1ed5a68             ; expf          (PLT -> imp.expf)
0x0106772c   vmovmi.f32 s22, s0         ; xc = max(x, 0)
0x01067738   vdiv.f32 s22, s20, s0      ; sig = 1 / (1 + exp(-8x))
0x0106773c   bl   0x1ed58dc             ; powf(xc, 0.62)          r5 = 0x3F1EB852 = 0.62f
0x0106774c   bl   0x1ed58dc             ; powf(orbSpeed, 0.62)
0x01067760   vmul.f32 s0, s0, s16       ; powf(orbSpeed,0.62) * n
0x01067770   vmul.f32 s0, s0, s2        ;   * (1 - sig)
0x01067774   vmla.f32 s0, s22, s4       ;   + sig * (powf(xc,0.62) + 1.2)
0x01067778   vmul.f32 s22, s0, s18      ;   * 100
   ; ... Math.Round to even (fmod ±0.5 / floorf / ceilf) ...
0x01067818   vdiv.f32 s0, s20, s18      ;   / 100
0x0106781c   vdiv.f32 s16, s0, s16      ;   / orbCount
```

```csharp
float x   = orbSpeed * orbCount - 1.2f;
float sig = 1f / (1f + expf(-8f * x));
float v   = powf(orbSpeed, 0.62f) * orbCount * (1f - sig)
          + sig * (powf(max(x,0f), 0.62f) + 1.2f);
rotateSpeed = RoundToEven(v * 100f) / 100f / orbCount;      // degrees per 1/60 s
```

A sigmoid blend between two saturating regimes, then divided by orb count. **Sentry Protocol
deletes this entirely** and uses raw `orbSpeed` linearly. That is the single biggest reason the
module changes how the stat should be valued.

---

## 10. Verification status

**PROVEN — traced to executed code, snippet quoted above**

* infoIndex 50, `type = Armor(1)`, `rarity = Epic(4)`, `benefitType = Normal(0)`.
* `uniqueBenefit = {1,2,3,4}` — SHA-256 self-verified against the initializer field's own name,
  with the method first validated on module 52's known values.
* Rarity→tier boundaries (5 / 7 / 9), and the assist-slot `4 + level*2` rarity synthesis.
* Workshop ring `rotateSpeed := 0`; `Rotate.Update` early-out on `rotateSpeed == 0`.
* Extra-Orb ring `rotateSpeed := 0` and early return, checked every frame.
* Orb→enemy contact handler skipped when equipped (`CompareTag("orb")` branch).
* `localEulerAngles = Vector3.zero` on both rings; movement particles `Stop()`.
* Workshop cooldown `1/(orbSpeed*5)`; card cooldown `0.5/(cardBenefit + researchBenefit[14])`.
* Card orb count `(int)researchBenefit[73] + 1`; card branch gated on `cardActive[16]`.
* No catch-up (`last[i] = now`), driven from `Main.Update` once per rendered frame.
* `Time.timeScale = gameSpeed × f(gameSpeed)` with the 0.80…1.15 factor ladder.
* `OverlapCircle(orbPos, 1.5f, mask{"enemy","boss","Fleets"}, hits)`; nearest-N by 2-D distance;
  `Targetable` filter; one `OrbFire` per selected target; no cross-orb dedup.
* Pool dequeue/empty-drop; pool built in `Main.Awake` from `orbProjectiles[]`; refilled by
  `Projectile.Deactivate`.
* `Projectile.Activate` orb branch skipping the whole damage/crit/multishot block;
  `maxActiveTime = Time.time + 10`.
* Homing step `min(fixedΔt × 2.5 × (1 + attackSpeed × 0.0625), 0.1)`.
* `OnTriggerEnter2D` → `Enemy.OrbHit()` → `RequestSafeDeactivate()`.
* `Enemy.OrbHit` full control flow, including the `enemyType 6..12` early return, the lab-18 gate,
  the heat-condition split, the armor-then-kill regime, `markedByOrbs`, and the module-18 debuff
  clamped at 0.5.
* `Enemy.OrbCoinBonus` gating on `markedByOrbs || gilded`.

**INFERRED / NOT RECOVERED**

* **`Main.orbProjectiles.Length` — the mini-orb pool size.** It is a Unity-inspector array on the
  `Main` MonoBehaviour, not a binary constant. The *mechanism* (silent drop on empty) is proven;
  the *number* is not. This is the one figure I would most want next, and it is only obtainable
  from the scene asset (`level1` MonoBehaviour) or by in-game observation.
* **`cards.cardBenefit[16, level]` — the Extra Orb card's speed table.** Recovering it means
  decoding `Cards.Initialization`, which I did not do. The card-orb fire-rate *formula* is proven;
  the numbers you would plug into it are not.
* **Lab research index 14's display name.** The code path is proven (`researchBenefit[14]` adds to
  the Extra Orb ring speed and to the sentry card fire rate); the human-facing name is not pinned.
  Research 18 = "Orbs Boss Hit" and 73 = "Extra Extra Orbs" *are* pinned, by exact behavioural
  match with the localization text.
* `CustomizeGame.GetResistanceLevel(0, -1)`'s return scale (fraction vs percent) was not traced
  into; only that it multiplies `enemyHealthMax`.
* The `roundsStartedThisTier[1] <= 3 → factor 1.15` branch in `GameSpeedModifier` is read
  correctly but its purpose is a guess (early-game speed nudge).

**CORRECTIONS MADE MID-DIVE** *(both are traps for the next session)*

1. **r2 6.2.0 mis-prints VFP immediates.** `vmov.f32 sX, #imm` is rendered integer-truncated.
   Two load-bearing numbers were wrong on first read: the card-orb multiplier printed as `5` is
   **0.5** (`imm8 = 0x60`), and `maxActiveTime`'s addend printed as `1` is **10.0**
   (`imm8 = 0x24`). Also `BASE_SPEED` printed as `2` is **2.5**, matching the declared const.
   Always re-decode `vmov.f32`/`vmov.f64` immediates with `VFPExpandImm`.
2. **First reading of the module said only "the orbs stop rotating."** That is incomplete —
   `Enemy.OnTriggerEnter2D` refuses the `"orb"` tag outright when the module is equipped, so
   contact damage is *removed*, not merely made unreachable by a stationary orb.

---

## 11. Pointers

### Methods / RVAs (29.0.0 armeabi-v7a)

| Method | RVA | Note |
|---|---|---|
| `Main.Update` | 0x1057940 | sentry gate @0x10580D0, dispatch @0x1058144 |
| `Main.SentryProtocolUpdate(int)` | 0x10565B4 | both cooldown loops |
| `Main.SentryProtocolFire(Vector3,int)` | 0x1055CC0 | OverlapCircle + target selection |
| `Main.GetSentryProtocolWorkshopOrbsAttackSpeed` | 0x1055BB8 | `1/(orbSpeed*5)` |
| `Main.GetSentryProtocolCardOrbsAttackSpeed` | 0x1055BD4 | `0.5/(cardBenefit+lab14)` |
| `Main.UpdateClosestEnemiesToPoint` | 0x1056058 | Targetable filter, distance sort |
| `Main.OrbFire(Vector3,int)` | 0x105651C | pool → `Projectile.Activate` |
| `Main.TryGetOrbProjectile` | 0x10570C4 | pool dequeue; false = shot dropped |
| `Main.OrbCheck` | 0x10674E4 | rotateSpeed := 0 @0x1067868; euler/particles @0x1067FA4 |
| `Main.Awake` | 0x1033CA8 | builds `orbProjectilesPool` @0x10346FC |
| `Main.FixedUpdate` | 0x1057574 | drives `ProjectileMovement` @0x10576CC |
| `Main.GameSpeedModifier` | 0x10603C4 | `Time.timeScale = gameSpeed * f(gameSpeed)` |
| `Main.CalculateUpgradeBonuses` | 0x1040A28 | writes `orbSpeed` @0x1046114/0x10461C0 |
| `Rotate.Update` | 0x127D578 | early-out on `rotateSpeed == 0` |
| `RotateInnerOrb.Update` | 0x127D934 | sentry check @0x127DB0C |
| `RotateInnerOrb.CheckOrbs(float)` | 0x127DC98 | called only from `OrbCheck` @0x1067E98 |
| `Projectile.Activate(Vector3,Enemy)` | 0x11FD12C | orb branch @0x11FD21C |
| `Projectile.ProjectileMovement(float)` | 0x11FC68C | homing + expiry |
| `Projectile.OnTriggerEnter2D` | 0x11FCB50 | type switch @0x11FCC54 |
| `Projectile.OrbProjectileHit(Enemy)` | 0x11FCF18 | tail call to `Enemy.OrbHit` |
| `Projectile.Deactivate` | 0x11FC960 | re-enqueue by type @0x11FC9F8 |
| `Enemy.OrbHit` | 0x150432C | the whole hit model |
| `Enemy.OrbDamage(double)` | 0x14F3388 | armor first, then health |
| `Enemy.OrbCoinBonus` | 0x14F8A30 | gated on `markedByOrbs \|\| gilded` |
| `Enemy.OnTriggerEnter2D` | 0x1500A70 | `"orb"` tag suppressed @0x1500DD8 |
| `Enemy.get_Targetable` | 0x14E2970 | |
| `ModuleManager.Initialize` | 0x113DE18 | `modulesInfo[50]` record @0x113EEA8 |
| `ModuleManager.GetUniqueBenefit` | 0x114C7D8 | rarity → tier |
| `ModuleManager.TryGetUniqueBenefit` | 0x1164EA8 | primary + assist scan |
| `CustomizeGame.GetResistanceLevel` | 0x14ADAC8 | Orb Resistance heat |

### Fields

| Field | Offset | Class |
|---|---|---|
| `orbSpeed` | 0x378 | Main |
| `orbCount` | 0x37C | Main |
| `orbObjects` / `orbSprites` | 0x234 / 0x238 | Main |
| `orbDefaultSprite` / `EllipseSprite` / `MagicSprite` | 0x23C / 0x240 / 0x244 | Main |
| `orbSpeedScript` (`Rotate`) | 0x248 | Main |
| `orbMovementParticles` | 0x24C | Main |
| `orbProjectiles` (`Projectile[]`) | 0x470 | Main |
| `enemy` (`Enemy[]`) | 0x4D4 | Main |
| `orbProjectilesPool` (`Queue<Projectile>`) | 0x1084 | Main |
| `sentryProtocolLastWorkshopOrbsAttack` | 0x10E0 | Main |
| `sentryProtocolLastCardOrbsAttack` | 0x10E4 | Main |
| `sentryProtocolHits` (`List<Collider2D>`) | 0x10E8 | Main |
| `sentryProtocolLayerMask` | 0x10EC | Main |
| `sentryProtocolFilter` (`ContactFilter2D`, 0x1C bytes) | 0x10F0 | Main |
| `sentryProtocolClosest` | 0x110C | Main |
| `isTankUltimateOn` | 0xF30 | Main |
| `towerSpawning` | 0x111C | Main |
| `orbHitsThisRound` | 0x7A8 | Main |
| `attackSpeed` | 0x2D8 | Main |
| `gameSpeed` (static) | +0x4 | Main |
| `rotateSpeed` / `rotatePausedBool` / `flipRotation` | 0x10 / 0x14 / 0x1C | Rotate |
| `cards` / `lab` / `orbs` / `orbSpeedReducer` | 0x14 / 0x18 / 0x24 / 0x38 | RotateInnerOrb |
| `rotateSpeed` | 0x1C | RotateInnerOrb |
| `cardOrbObject` / `cardOrbScript` | 0x2C0 / 0x2C4 | Cards |
| `cardLevel` / `cardActive` / `cardBenefit` | 0x28 / 0x40 / 0x48 | Cards |
| `researchLevel` / `researchBenefit` | 0x108 / 0x12C | Lab |
| `target` / `maxActiveTime` / `projectileType` | 0x10 / 0x24 / 0x30 | Projectile |
| `enemyType` / `enemyHealth` / `enemyHealthMax` / `enemyArmor` | 0x30 / 0x50 / 0x58 / 0x94 | Enemy |
| `number` | 0x2C | Enemy |
| `inProtector` / `canBeHitKilled` | 0x162 / 0x164 | Enemy |
| `magicOrbDebuff` / `markedByOrbs` | 0x168 / 0x16C | Enemy |
| `gilded` / `alreadyHitByOrb` | 0x208 / 0x20B | Enemy |
| `modulesInfo` (16-byte records) | 0x44 | ModuleManager |
| `equipped` / `assistModuleSlots` | 0x50 / 0x10C | ModuleManager |
| `heatLevel` (`int[]`) | 0x18 | CustomizeGame |

### Constants

| Value | Meaning | Where read |
|---|---|---|
| **50** (`0x32`) | Sentry Protocol infoIndex | `mov r1, 0x32` @0x10580C8 (Update), 0x106785C (OrbCheck), 0x127DB04 (RotateInnerOrb.Update), 0x1500DD4 (Enemy.OnTriggerEnter2D) |
| **{1, 2, 3, 4}** | `uniqueBenefit` — mini orbs per volley | metadata blob @6749936, SHA-256 verified |
| **1.5** | `SENTRY_PROTOCOL_RADIUS` | `mov r2, 0x3fc00000` @0x1055F4C |
| **5.0** | workshop rate factor | `vmov.f32 s0` imm8=0x14 @0x1055BB8, 0x1056698 |
| **0.5** | card rate factor | `vmov.f32 s2` imm8=0x60 @0x1055CA8 |
| **0** | forced `rotateSpeed` | @0x1067944 (f32 0.0) / `mov r0,0` @0x127DB24 |
| **10.0** | `maxActiveTime` lifetime (s) | `vmov.f32 s0` imm8=0x24 @0x11FD214 |
| **2.5** | `Projectile.BASE_SPEED` | `vmov.f32 s0` imm8=0x04 @0x11FC77C |
| **0.0625** | attackSpeed→travel-speed factor | literal @0x11FC938 |
| **0.1** | travel-step cap (units/tick) | literal @0x11FC93C |
| **0.5** | module-18 debuff cap | `vmov.f32 s4` imm8=0x60 @0x15046E4 |
| **1.0 / 0.94 / 0.88** | `orbSpeedReducer` by lab-73 level | @0x1067E50 / 0x1067F08 / 0x1067F0C |
| **-1.2 / -8 / 0.62 / 1.2 / 100** | vanilla orb-speed curve | 0x1067940 / 0x10676F8 / `0x3F1EB852` / 0x1067948 / 0x106794C |
| **0.80 … 1.15** | game-speed → timeScale factors | literal pool @0x10605E8–0x1060604 |
| **18** | lab "Orbs Boss Hit" index | `[lab+0x108/0x12C] + 0x58` |
| **14** | lab index feeding Extra Orb speed | `[lab+0x12C] + 0x48` |
| **73** | lab "Extra Extra Orbs" index | `[lab+0x12C] + 0x134`, `[lab+0x108] + 0x134` |
| **16** | `CardID.InnerOrb` (in-game "Extra Orb") | `cardActive[16]`, `cardLevel[16]` |
| **3690** | localization term for the description | *"Orb speed is reduced to zero. Orbs instead fire {0} mini orbs."* |

### Workspace gotchas discovered during this dive

* **`CLAUDE.md` is stale.** It describes 28.3.0 / arm64 / `decomp/`. Sentry Protocol only exists in
  29.0.0, whose artifacts are `decomp29/` + `arm_apk/lib/armeabi-v7a-29.0.0/libil2cpp.so`, and
  which is **ARM (A32), not Thumb** — a Thumb-2 `BL` scan finds zero callers.
* **`tdec.py` (both copies) silently produces nothing**: `~/.local/share/radare2/plugins/core_ghidra.dylib`
  was built for r2 6.1.4 and the installed r2 is 6.2.0, so `pdg` reports
  *"You need to install the plugin with r2pm -ci r2ghidra"*. Use bounded `pd` + manual annotation
  until it is rebuilt. Also: **two concurrent `tdec.py` runs clobber each other** — both write
  `decomp29/work/.tdec_cmds.r2`.
* **`vaddr != paddr` in this ELF beyond `.text`.** Section deltas: code `0`, `.data.rel.ro`/`.got`
  `−0x4000`, `.data` `−0x8000`. String-literal and metadata slots live in `.data`
  (`0x3FCB6A4`–`0x4009934`), reached through the GOT — reading them at the raw vaddr gives garbage
  that still *looks* like a plausible symbol name.
* The IL2CPP literal idiom here is `ldr rX,[pc,#±imm]` (offset constant) followed by
  `ldr rX,[pc,rX]` (GOT deref) — note the **negative-offset** (`U=0`, `0xE51F….`) variant, which a
  naive `0xE59F` match misses.
