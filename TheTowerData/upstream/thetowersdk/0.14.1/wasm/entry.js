/**
 * The SDK behind one WebAssembly call, for languages that are not JavaScript.
 *
 * The game data and the formulas are TypeScript, and TypeScript does not run in Python, Rust, Go,
 * C#, Java or PHP. The usual answers are to port the numbers — which guarantees two versions that
 * drift — or to stand up a web service, which turns a library into infrastructure someone has to
 * host.
 *
 * This is the third answer. The whole package is compiled into a WASI module, so any language with
 * a WebAssembly runtime can load one file and call the same code this project ships to JavaScript.
 * No port, no server, no network: the catalogs and calculators run in
 * the caller's own process.
 *
 * ## The protocol
 *
 * One JSON object in on stdin, one JSON object out on stdout. That is the whole interface, chosen
 * because every language can already write and read JSON, and because a WASI module's stdio is
 * the one thing every runtime exposes identically.
 *
 *     {"op": "calc.run", "id": "thorns.damage", "input": {"baseThorns": 120}}
 *     -> {"ok": true, "result": {...}}
 *
 * Errors are values, not traps: `{"ok": false, "error": "..."}`. A trap gives the caller a
 * runtime-specific abort with no message, which in a foreign language is close to unreadable.
 *
 * Discovery is part of the protocol rather than documentation to keep in sync — `{"op": "ops"}`
 * lists every operation the module actually carries.
 */

import { CALCULATOR_BUILDERS, findCalculatorBuilder } from '../dist/builders/index.js'
import * as data from '../dist/data/index.js'
import * as formatting from '../dist/formatting/index.js'
import * as mechanics from '../dist/mechanics/index.js'
import { SHARED_CHART_REGISTRY, resolveCanonicalToolDataset } from '../dist/charts/index.js'
import { CONTRIBUTIONS, ATTRIBUTION_LINES } from '../dist/contributions/index.js'

/*
 * Number grouping, because the guest has no Intl.
 *
 * QuickJS inside Javy ships without ICU, so `toLocaleString` returns the plain digits and
 * `formatGroupedNumber(4770477147914)` answered '4770477147914' here and '4,770,477,147,914' in
 * Node. The module would have been quietly giving different answers than the library it is a build
 * of — the worst kind of difference, because both look like numbers.
 *
 * This restores the default grouping only. A caller asking for a specific locale still gets the
 * default: real locale formatting needs the data ICU carries, and pretending otherwise would be a
 * second wrong answer rather than the first one. `wasm-matches-the-library.test.ts` compares the
 * two builds so any further divergence is caught rather than discovered.
 */
if (typeof Intl === 'undefined') {
  const groupInteger = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  Number.prototype.toLocaleString = function toLocaleString(_locale, options = {}) {
    if (!Number.isFinite(this.valueOf())) return String(this.valueOf())

    const value = this.valueOf()
    const min = options.minimumFractionDigits
    const max = options.maximumFractionDigits

    /*
     * Expand exponential notation before grouping.
     *
     * `String(1.343e24)` is '1.343e+24', and grouping that produces nonsense. `toFixed` is no help
     * either: the spec has it return the exponential form for anything at or above 1e21, which is
     * exactly the range the game reaches. So the mantissa is expanded with string arithmetic —
     * exact, and free of the float error a BigInt round-trip would introduce.
     *
     * Caught by the parity test rather than by reading, twice: once for the missing separators and
     * again for this.
     */
    const expand = (number) => {
      const plain = String(number)
      const match = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/i.exec(plain)
      if (!match) return plain

      const [, sign, whole, fraction = '', exponent] = match
      const shift = Number(exponent)
      const digits = whole + fraction
      const pointAt = whole.length + shift

      if (pointAt >= digits.length) return sign + digits + '0'.repeat(pointAt - digits.length)
      if (pointAt <= 0) return `${sign}0.${'0'.repeat(-pointAt)}${digits}`
      return `${sign}${digits.slice(0, pointAt)}.${digits.slice(pointAt)}`
    }

    let text = min !== undefined || max !== undefined
      ? value.toFixed(Math.max(min ?? 0, Math.min(max ?? 3, 20)))
      : expand(value)

    /* toFixed pads to the maximum; the platform trims back to the minimum. */
    if (max !== undefined && text.includes('.')) {
      text = text.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
      const [, fraction = ''] = text.split('.')
      if (min !== undefined && fraction.length < min) {
        text = `${text.includes('.') ? text : `${text}.`}${'0'.repeat(min - fraction.length)}`
      }
    }

    if (options.useGrouping === false) return text
    const [whole, fraction] = text.split('.')
    const sign = whole.startsWith('-') ? '-' : ''
    const grouped = groupInteger(whole.replace('-', ''))
    return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fraction}`
  }
}

/** Guard every lookup that takes a name from outside: `data[key]` reaches the prototype. */
const own = (object, key) =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key)
    ? object[key]
    : undefined

/**
 * A value the caller's language can hold.
 *
 * Functions and class instances mean nothing across this boundary, and a catalog can be thousands
 * of rows — so lists are paged rather than truncated silently. `total` is always the real count,
 * which is what stops a caller reading 100 rows and believing that is all of them.
 */
function page(list, { offset = 0, limit = 100 } = {}) {
  const start = Math.max(0, Number(offset) || 0)
  const size = Math.min(Math.max(1, Number(limit) || 100), 1000)
  return {
    total: list.length,
    offset: start,
    limit: size,
    items: list.slice(start, start + size),
  }
}

const OPS = {
  /** What this module can do, so a caller never has to guess from documentation. */
  'ops': () => ({ ops: Object.keys(OPS).sort() }),

  'version': () => ({
    /* Read from the package rather than restated, so it cannot claim a version it is not. */
    formulas: Object.values(mechanics).filter(value => typeof value === 'function').length,
    calculators: CALCULATOR_BUILDERS.length,
    chartDatasets: SHARED_CHART_REGISTRY.length,
  }),

  // ---- catalogs -----------------------------------------------------------

  'data.list': () => ({
    catalogs: Object.keys(data)
      .filter(key => /^[A-Z][A-Z0-9_]+$/.test(key) && Array.isArray(data[key]))
      .sort(),
  }),

  'data.get': ({ name, offset, limit }) => {
    const catalog = own(data, name)
    if (catalog === undefined) return { error: `no catalog named ${name}` }
    if (!Array.isArray(catalog)) return { value: catalog }
    return page(catalog, { offset, limit })
  },

  'data.find': ({ name, where, offset, limit }) => {
    const catalog = own(data, name)
    if (!Array.isArray(catalog)) return { error: `no catalog named ${name}` }
    const rules = Object.entries(where ?? {})
    const matches = catalog.filter(row =>
      rules.every(([field, wanted]) => String(row?.[field]) === String(wanted)),
    )
    return page(matches, { offset, limit })
  },

  // ---- calculators --------------------------------------------------------

  'calc.list': () => ({
    calculators: CALCULATOR_BUILDERS.map(builder => ({
      id: builder.id,
      title: builder.title,
      summary: builder.summary,
    })),
  }),

  'calc.describe': ({ id }) => {
    const builder = findCalculatorBuilder(id)
    if (!builder) return { error: `no calculator with id ${id}` }
    return { id: builder.id, title: builder.title, fields: builder.fields, defaults: builder.defaults }
  },

  'calc.run': ({ id, input }) => {
    const builder = findCalculatorBuilder(id)
    if (!builder) return { error: `no calculator with id ${id}` }
    /*
     * The normalised input is returned alongside the result, because a value silently replaced by
     * a default is the difference between an answer to the question asked and an answer to a
     * different one — and from the result alone there is no way to tell.
     */
    const normalized = builder.normalize(input ?? {})
    return { id: builder.id, input: normalized, result: builder.compute(input ?? {}) }
  },

  // ---- formulas -----------------------------------------------------------

  'mechanics.list': ({ match }) => {
    const names = Object.keys(mechanics).filter(key => typeof mechanics[key] === 'function')
    const filtered = match
      ? names.filter(name => name.toLowerCase().includes(String(match).toLowerCase()))
      : names
    return { total: filtered.length, functions: filtered.sort().slice(0, 500) }
  },

  'mechanics.call': ({ name, args }) => {
    const fn = own(mechanics, name)
    if (typeof fn !== 'function') return { error: `no formula named ${name}` }
    return { name, result: fn(...(Array.isArray(args) ? args : [args ?? {}])) }
  },

  // ---- numbers ------------------------------------------------------------

  'format': ({ value }) => {
    if (typeof value === 'number') {
      return {
        display: formatting.formatNumberForDisplay(value),
        grouped: formatting.formatGroupedNumber(value),
      }
    }
    if (typeof value === 'string') return { parsed: formatting.parseNumberInput(value) }
    return { error: 'format takes a number to write, or a string to read' }
  },

  // ---- charts -------------------------------------------------------------

  'charts.list': () => ({
    charts: SHARED_CHART_REGISTRY.map(entry => ({ id: entry.id, title: entry.title })),
  }),

  'charts.rows': ({ id, offset, limit }) => {
    const dataset = resolveCanonicalToolDataset(id, [])
    if (!dataset) return { error: `no chart dataset named ${id}` }
    const rows = Array.isArray(dataset.rows) ? dataset.rows : []
    return { id, columns: dataset.columns ?? [], ...page(rows, { offset, limit }) }
  },

  // ---- attribution --------------------------------------------------------

  'contributions': () => ({ areas: CONTRIBUTIONS, lines: ATTRIBUTION_LINES }),
}

/**
 * Find every number JSON cannot carry.
 *
 * `JSON.stringify(NaN)` is `null`, and so is `Infinity`. A formula handed arguments it cannot use
 * returned NaN, the response serialised it as null, and the caller received
 * `{"ok": true, "result": null}` — a successful call with no answer, indistinguishable from a
 * formula that legitimately returns nothing. In Python or Go that null becomes `None` or `nil` and
 * flows onward.
 *
 * The value is left alone; what is added is the list of paths where it happened, so a caller can
 * see that a number was lost rather than inferring it.
 */
function nonFinitePaths(value, path = 'result', found = []) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) found.push(`${path} = ${Number.isNaN(value) ? 'NaN' : String(value)}`)
    return found
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => nonFinitePaths(entry, `${path}[${index}]`, found))
    return found
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) nonFinitePaths(entry, `${path}.${key}`, found)
  }
  return found
}

function handle(request) {
  const op = request?.op
  const run = own(OPS, op)
  if (!run) {
    return { ok: false, error: `unknown op: ${op}`, ops: Object.keys(OPS).sort() }
  }
  const output = run(request)
  /* An op reporting `error` is a failed call, not a successful one carrying a field named error. */
  if (output && typeof output === 'object' && 'error' in output) {
    return { ok: false, ...output }
  }

  const lost = nonFinitePaths(output)
  if (lost.length > 0) {
    return {
      ok: true,
      ...output,
      nonFinite: lost.slice(0, 20),
      warning:
        'Some numbers are not representable in JSON and were serialised as null. '
        + 'They are named in `nonFinite`.',
    }
  }
  return { ok: true, ...output }
}

function main() {
  /*
   * Read stdin whole before parsing. Javy exposes stdio through Javy.IO, and a single read call
   * returns only what was in the buffer — a request larger than one buffer arrives truncated, and
   * truncated JSON fails to parse with an error that says nothing about why.
   */
  const chunks = []
  const buffer = new Uint8Array(4096)
  let total = 0
  while (true) {
    const read = Javy.IO.readSync(0, buffer)
    if (read === 0) break
    chunks.push(buffer.slice(0, read))
    total += read
  }

  const input = new Uint8Array(total)
  let cursor = 0
  for (const chunk of chunks) {
    input.set(chunk, cursor)
    cursor += chunk.length
  }

  let response
  try {
    response = handle(JSON.parse(new TextDecoder().decode(input) || '{}'))
  } catch (error) {
    response = { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  const encoded = new TextEncoder().encode(JSON.stringify(response))
  Javy.IO.writeSync(1, encoded)
}

main()
