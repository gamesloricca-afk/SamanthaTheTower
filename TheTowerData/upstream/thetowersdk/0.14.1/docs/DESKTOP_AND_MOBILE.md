# Shipping a desktop or mobile app

The SDK is a plain TypeScript package with one runtime dependency (zod, for schema
validation) and no DOM assumptions,
so it runs unchanged in a browser, in Node, in an Electron renderer, in an Electron main
process, and inside a Capacitor WebView. What changes between those is not the SDK — it is
where the save file comes from and what is allowed to talk to the network.

---

## Pinning the toolchain first: corepack

Before any of this, pin the package manager. Corepack ships with Node and reads one field:

```json
{
  "packageManager": "pnpm@10.8.1+sha512.c50088ba998c67b8ca8c99df8a5e02fd2ae2e2b29aaf238feaa9e124248d3f48f9fb6db2424949ff901cffbb5e0f0cc1ad6aedb602cd29450751d11c35023677",
  "engines": { "node": ">=22 <23", "pnpm": "10.8.1" }
}
```

```bash
corepack enable
pnpm install          # now guaranteed to be that exact pnpm
```

The **hash matters**, and it is the part people trim. Without it `pnpm@10.8.1` is a name
resolved from a registry; with it, corepack verifies the tarball it downloaded is the one
you pinned. For a desktop app that is a supply-chain boundary — the package manager runs
before any of your own code does, on every machine that builds a release.

`engines` is the companion check: corepack pins the package manager, `engines` fails the
install on the wrong Node. Native modules are compiled against a Node ABI, so "works on my
machine, crashes on the build server" is usually this and nothing more interesting.

---

## Electron

The a caller ships a desktop build — electron-forge, packaged for Windows, macOS, deb and
rpm, with the bridge running inside it. What follows is what that app actually does, not a
generic template.

Two processes, and the split decides your architecture.

| | Runs | Can | Use it for |
|---|---|---|---|
| **Main** | Node | filesystem, child processes, native modules | reading save files, running the bridge |
| **Renderer** | Chromium | DOM | your UI |

The SDK sits in both, but not the same parts:

```ts
// main process — the decoder needs Node
import { decodePlayerInfoSaveBytes } from 'thetowersdk/node'

// renderer — everything else is browser-safe
import { LAB_CATALOG } from 'thetowersdk/data'
import { calculatorCommands } from 'thetowersdk/bot'
```

`thetowersdk/node` is the **only** entry point that needs Node. Importing it in a renderer
with `nodeIntegration: false` — which is the correct setting — fails at bundle time, and
that failure is the design working: the decoder belongs on the side of the boundary that is
allowed to read files.

### The window

```js
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js'),
  },
})
```

`nodeIntegration: false` and `contextIsolation: true` are the two that matter, and they are
not defaults you can assume — a renderer with Node integration is a renderer that can do
anything the main process can, and a Tower app loads remote content (wiki pages, community
sheets), which is exactly the path that makes it matter.

### The boundary is a named API, not `ipcRenderer`

```js
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  pickSaveFile: () => ipcRenderer.invoke('pick-save-file'),
  pullSaveFile: port => ipcRenderer.invoke('pull-save-file', String(port)),
  startBridge: () => ipcRenderer.invoke('start-bridge'),
  bridgeStatus: () => ipcRenderer.invoke('bridge-status'),
})
```

Expose named functions, never `ipcRenderer` itself. The renderer gets the four things it is
allowed to ask for, and adding a fifth is a deliberate edit in a file you can review.

Send the **extracted** shape across the boundary, not the decoded root. The root is large,
structured-clone copies all of it, and the renderer needs none of it:

```js
ipcMain.handle('pick-save-file', async () => {
  const decoded = decodePlayerInfoSaveBytes(await readFile(picked))
  if (!decoded.parsedRoot) return { error: 'That file is not a save.' }
  return { bots: readBotsFromSaveRoot(decoded.parsedRoot) }
})
```

### Running the bridge in-process

This is the main reason to ship a desktop build at all. On the web, the bridge is a separate
program the user has to install and keep running; in the desktop app it is a dependency and
starts inside the process — no terminal, no Node install:

```js
let embeddedBridge = null

async function startEmbeddedBridge() {
  if (embeddedBridge) return { running: true, port: 43781, alreadyRunning: true }
  try {
    const { startLocalAdbBridge, BRIDGE_VERSION } = await import('adb-bridge/server.mjs')
    embeddedBridge = startLocalAdbBridge({ backgroundCapable: false })
    return { running: true, port: 43781, version: BRIDGE_VERSION }
  }
  catch (error) {
    // Reported, not thrown: the app is still useful with a file picker.
    return { running: false, error: String(error?.message ?? error) }
  }
}
```

Two details worth copying. The guard makes starting it idempotent, because the renderer will
ask more than once and a second listener on 43781 fails in a way that reads as "bridge
broken". And the failure path **returns** rather than throwing, so a machine without ADB
degrades to the file picker instead of losing the window.

The same import gives you save discovery on desktop, where the file is local rather than on
a phone:

```js
const { discoverNativeHostPlayerInfoSave } = await import('adb-bridge/native-save-discovery.mjs')
```

### Packaging

```json
{
  "scripts": {
    "start": "electron-forge start",
    "premake": "rimraf out dist && pnpm --dir .. run build:electron:web",
    "make": "npm run premake && electron-forge make"
  }
}
```

`premake` rebuilds the web bundle from the monorepo before packaging. Without that step it
is entirely possible to ship an installer around a stale `dist/` — the build succeeds, the
app runs, and it is last week's site.

Two forge plugins earn their place:

- **`plugin-auto-unpack-natives`** — native modules cannot be loaded from inside an asar
  archive. Without this the app works in `electron-forge start` and fails only once
  packaged, which is the worst time to find out.
- **`plugin-fuses`** — flips off capabilities you are not using at the binary level:

  ```js
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableCookieEncryption]: true,
  ```

  `RunAsNode` and `NODE_OPTIONS` are how a packaged Electron binary gets turned into a
  general-purpose Node interpreter running someone else's script. Turning them off costs
  nothing if you do not use them.

## Mobile

Two shapes, and they differ in whether you have a Node process at all.

### Capacitor — a WebView with native plugins

Your existing web build ships almost unchanged. Every browser-safe SDK entry point works;
`thetowersdk/node` does not, because there is no Node.

```bash
npm install @capacitor/core @capacitor/cli
npx cap init && npx cap add android
npx cap sync
```

The save file is the only real problem. On Android the game's save sits in app-private
storage, which another app cannot read — so on-device there is no equivalent of the bridge,
and the realistic routes are a file picker (the user exports the save themselves) or cloud
sync (your server holds it). Decide which before building the UI around it; retrofitting is
painful because it changes what the first screen asks for.

### React Native — a JS runtime, no DOM

Data, formatting, mechanics, builders and bot all work — they are plain TypeScript with no
DOM. `thetowersdk/node` does not; the decoder uses Node's `Buffer` and stream primitives.
Decode server-side and send the extracted shape down, which is what you want anyway: it is
smaller and it means one implementation of decoding rather than one per platform.

---

## What to check before you ship

- **Bundle size.** Import the subpaths (`thetowersdk/data`) rather than the root, so your
  bundler can drop what you do not use. The root re-exports data, save and formatting
  together for convenience, and convenience is expensive on mobile.
- **The decoder is the only Node-only part.** If something else fails to bundle for a
  browser target, it is worth reporting — that is a bug in this package, not in your setup.
- **Pin the toolchain in CI too.** `corepack enable` in the workflow, or the release is
  built by whatever pnpm the runner happened to have.
