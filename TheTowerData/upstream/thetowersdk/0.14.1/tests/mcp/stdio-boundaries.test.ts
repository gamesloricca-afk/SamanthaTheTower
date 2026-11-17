/** Exercise the actual pipe protocol, including invalid messages and split UTF-8 input. */
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('imports the MCP server without creating directories', () => {
  const serverUrl = new URL('../../mcp/server.mjs', import.meta.url).href
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    const exists = fs.existsSync;
    fs.existsSync = path => String(path).replaceAll('\\\\', '/').endsWith('/docs/mechanics-map') ? false : exists(path);
    fs.mkdirSync = () => { throw new Error('Unexpected directory creation during import'); };
    await import(${JSON.stringify(serverUrl)});
    console.log('imported');
  `], { windowsHide: true, timeout: 10_000, encoding: 'utf8', env: { ...process.env, TOWER_MECHANICS_MAP_DIR: '' } })
  expect(output.trim()).toBe('imported')
})

it('survives invalid input, refuses prototype methods and only answers requests', async () => {
  const moduleUrl = new URL('../../mcp/run-stdio.mjs', import.meta.url).href
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { runStdioMcp } from ${JSON.stringify(moduleUrl)};
    runStdioMcp({ name: 'test', version: '1', tools: { echo: { run: args => args } } });
  `], { windowsHide: true, cwd: fileURLToPath(new URL('../..', import.meta.url)) })
  let output = ''
  let stderr = ''
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk })
  const done = new Promise<void>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`stdio exited ${code}: ${stderr}`)))
  })
  try {
    child.stdin.write('null\n{\n')
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'initialize' }) + '\n')
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'constructor' }) + '\n')
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'constructor' } }) + '\n')
    const message = Buffer.from(JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'echo', arguments: { text: '塔' } } }) + '\n')
    const split = message.indexOf(Buffer.from('塔')) + 1
    child.stdin.write(message.subarray(0, split))
    await new Promise(resolve => setTimeout(resolve, 20))
    child.stdin.end(message.subarray(split))
    await done
    const replies = output.trim().split('\n').map(line => JSON.parse(line))
    expect(replies).toHaveLength(5)
    expect(replies.filter(reply => reply.id === null).map(reply => reply.error.code)).toEqual([-32600, -32700])
    expect(replies.find(reply => reply.id === 1).error.code).toBe(-32601)
    expect(replies.find(reply => reply.id === 2).result.isError).toBe(true)
    expect(JSON.parse(replies.find(reply => reply.id === 3).result.content[0].text)).toEqual({ text: '塔' })
    expect(stderr).toBe('')
  } finally {
    if (child.exitCode === null) child.kill()
  }
}, 10_000)
