import { describe, expect, it } from 'vitest'
import { IN_MONOREPO, everyTool, expectedRegistries, loadedRegistries } from '../helpers/every-tool'

/**
 * A parameter with no description is a parameter an agent has to guess at.
 *
 * The schema IS the documentation here. There is no reference page an agent consults first — it
 * receives `tools/list` and calls. So a bare `{ type: 'string' }` says only "a string goes here",
 * and the caller supplies something plausible and wrong.
 *
 * Sixteen parameters across eleven tools shipped that way. The ones that mattered:
 *
 * - `sdk_graph_mutate.ops` — a MUTATING tool whose only parameter was an undescribed array of
 *   objects. Nothing said what an op looks like or that the call refuses to persist against a
 *   failing TrustReport.
 * - `sdk_graph_get.status` and `.module` took free-form strings against closed vocabularies the
 *   graph already defines (`researching|verified|disputed|deprecated`, `core|ep`). They are enums
 *   now, so a wrong value is rejected rather than silently matching nothing.
 *
 * Worth recording what the audit got WRONG, because it shaped this test. It flagged
 * `record_work_status.status` as undescribed — but that one always had an enum AND runtime
 * validation rejecting `done`/`complete`/`finished`. An enum documents a closed set better than
 * prose does, so the rule below accepts either.
 */

/*
 * The canonical registry, which knows all three servers.
 *
 * The first version of this file read two of them, passed, and missed eight bare parameters. It
 * then grew a subprocess to read the third — unnecessary, as it turns out: vitest transforms the
 * epaths server fine, and only the slim MERGER cannot be imported. `every-tool.ts` does it once so
 * no audit has to decide again.
 */
const EVERY_TOOL = everyTool()

/**
 * Parameters that legitimately declare no `type`.
 *
 * `sdk_sandbox_run.value` takes a number to write or a string to read, and says exactly that. JSON
 * Schema can express the union, but MCP clients vary in how they handle an array-valued `type`,
 * and a description that names both cases already tells a caller what to send. Listed rather than
 * silently exempted, so the next typeless parameter has to argue for itself.
 */
const POLYMORPHIC = new Set(['sdk_sandbox_run.value'])

const JSON_SCHEMA_TYPES = new Set([
  'string', 'number', 'integer', 'boolean', 'object', 'array', 'null',
])

describe('every tool parameter explains itself', () => {
  it('audits every registry, not just the one nearest to hand', () => {
    /*
     * A floor, not a constant. `> 60` was true only where all three registries load; the published
     * package has two and 51 tools, so the number asserted a fact about the monorepo while claiming
     * to describe the surface. The registries themselves are the thing to check.
     */
    expect(loadedRegistries()).toEqual(expectedRegistries())
    expect(Object.keys(EVERY_TOOL).length).toBeGreaterThan(IN_MONOREPO ? 60 : 40)

    /* Named explicitly: if the sibling stops loading, this must fail rather than quietly shrink. */
    const expected = IN_MONOREPO
      ? ['get_export', 'oracle_traps', 'eval_formula', 'record_ep_relation']
      : ['get_export', 'oracle_traps']

    for (const name of expected) {
      expect(EVERY_TOOL[name], `${name} missing — a registry did not load`).toBeDefined()
    }
  })

  it('describes every parameter, or constrains it with an enum', () => {
    const bare: string[] = []

    for (const [tool, def] of Object.entries(EVERY_TOOL)) {
      for (const [param, spec] of Object.entries(def.inputSchema?.properties ?? {})) {
        const described = typeof spec.description === 'string' && spec.description.length >= 12
        const constrained = Array.isArray(spec.enum) && spec.enum.length > 0
        if (!described && !constrained) bare.push(`${tool}.${param}`)
      }
    }

    expect(bare, 'the schema is the only documentation an agent gets').toEqual([])
  })

  it('gives every parameter a JSON Schema type', () => {
    const untyped: string[] = []

    for (const [tool, def] of Object.entries(EVERY_TOOL)) {
      for (const [param, spec] of Object.entries(def.inputSchema?.properties ?? {})) {
        if (POLYMORPHIC.has(`${tool}.${param}`)) continue
        if (Array.isArray(spec.enum) && spec.enum.length > 0) continue
        if (typeof spec.type === 'string' && JSON_SCHEMA_TYPES.has(spec.type)) continue
        untyped.push(`${tool}.${param} (type: ${JSON.stringify(spec.type)})`)
      }
    }

    expect(untyped).toEqual([])
  })

  it('never requires a parameter it does not declare', () => {
    /*
     * A `required` naming a property that is not in `properties` is a schema a strict client can
     * reject outright, and one a lenient client will let through while the tool waits for
     * something the caller was never told to send.
     */
    const phantom: string[] = []

    for (const [tool, def] of Object.entries(EVERY_TOOL)) {
      const properties = def.inputSchema?.properties ?? {}
      for (const name of def.inputSchema?.required ?? []) {
        if (!(name in properties)) phantom.push(`${tool} requires undeclared "${name}"`)
      }
    }

    expect(phantom).toEqual([])
  })

  it('gives every tool a description and a runnable body', () => {
    const broken: string[] = []

    for (const [tool, def] of Object.entries(EVERY_TOOL)) {
      if (typeof def.run !== 'function') broken.push(`${tool}: run is not a function`)
      if (!def.description || def.description.length < 40) {
        broken.push(`${tool}: description is ${def.description?.length ?? 0} chars`)
      }
      if (def.inputSchema && def.inputSchema.type !== 'object') {
        broken.push(`${tool}: inputSchema.type is ${def.inputSchema.type}`)
      }
    }

    expect(broken).toEqual([])
  })
})
