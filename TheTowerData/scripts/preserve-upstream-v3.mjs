#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation v3.0.1
 * Requires Node.js >= 20, Git, GNU tar, and gzip.
 * Fetches and preserves a pinned upstream commit. It does not install or
 * execute TheTowerSDK and does not approve public redistribution.
 */

import {
  mkdir,
  writeFile,
  rm,
  rename,
  stat,
  lstat,
  chmod,
  symlink,
  readlink,
  readdir,
  mkdtemp,
} from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';

const SCRIPT_VERSION = '3.0.1';

const CONFIG = {
  repository: 'https://github.com/TmRxJD/TheTowerSDK.git',
  repositoryName: 'TheTowerSDK',
  packageName: 'thetowersdk',
  sdkVersion: '0.14.1',
  gameVersion: null,
  commit: '9a95672578fa064d71ddd54fad2ce5027a310b3a',
  maxBlobBytes: 128 * 1024 * 1024,
  maxTotalBytes: 2 * 1024 * 1024 * 1024,
  maxEntries: 100000,
  maxSymlinkBytes: 4096,
  maxCommandOutputBytes: 128 * 1024 * 1024,
  maxStderrBytes: 4 * 1024 * 1024,
  outputDirectory: resolve(
    process.argv[2] ?? 'TheTowerData/staging/thetowersdk/0.14.1'
  ),
};

const PROVENANCE_RULES = [
  {
    id: 'EFFECTIVE_PATHS',
    patterns: [/effective-paths/i, /effective\.paths/i],
    status: 'CLARIFICATION_REQUIRED',
    reason: 'Community spreadsheet-derived material; redistribution scope requires clarification.',
  },
  {
    id: 'ORPHIS',
    patterns: [/labs-categories\.generated/i, /lab-categories\.json/i],
    status: 'CLARIFICATION_REQUIRED',
    reason: 'Orphis-related material; redistribution terms require clarification.',
  },
  {
    id: 'TOWER_IDLE_TOOLKIT',
    patterns: [
      /base-empirical-scaling/i,
      /scaling-regression-profile/i,
      /mechanics\/combat\/damage/i,
      /mechanics\/combat\/bonuses/i,
      /formatting\/duration/i,
    ],
    status: 'LICENSE_REVIEW',
    reason: 'Potential tower-idle-toolkit-derived material; verify applicable attribution.',
  },
];

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const { input, ...spawnOptions } = options;

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...spawnOptions,
    });

    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    let limitError = null;

    const finishReject = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    child.stdout?.on('data', (chunk) => {
      stdoutBytes += chunk.length;

      if (stdoutBytes > CONFIG.maxCommandOutputBytes) {
        limitError = new Error(
          `${command} exceeded stdout output limit.`
        );
        child.kill('SIGTERM');
        return;
      }

      stdout.push(chunk);
    });

    child.stderr?.on('data', (chunk) => {
      stderrBytes += chunk.length;

      if (stderrBytes <= CONFIG.maxStderrBytes) {
        stderr.push(chunk);
      }

      if (stderrBytes > CONFIG.maxStderrBytes && !limitError) {
        limitError = new Error(
          `${command} exceeded stderr output limit.`
        );
        child.kill('SIGTERM');
      }
    });

    child.on('error', finishReject);

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;

      if (limitError) {
        reject(limitError);
      } else if (code !== 0) {
        reject(new Error(
          `${command} exited with code ${code}${signal ? ` (signal ${signal})` : ''}\n` +
          Buffer.concat(stderr).toString('utf8')
        ));
      } else {
        resolvePromise({
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr),
        });
      }
    });

    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

function decodeGitPath(buffer) {
  const value = new TextDecoder('utf-8', {
    fatal: true,
  }).decode(buffer);

  if (!Buffer.from(value, 'utf8').equals(buffer)) {
    throw new Error('Git path is not losslessly UTF-8.');
  }

  if (
    value.startsWith('/') ||
    value.includes('\\') ||
    value.includes('\0') ||
    value.split('/').some((part) =>
      !part || part === '.' || part === '..'
    )
  ) {
    throw new Error(`Unsafe Git path: ${value}`);
  }

  return value;
}

function parseTree(raw) {
  const records = [];
  let start = 0;

  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] !== 0) continue;

    const record = raw.subarray(start, i);
    start = i + 1;

    if (record.length === 0) continue;

    const tab = record.indexOf(9);

    if (tab < 0) {
      throw new Error('Invalid Git tree record.');
    }

    const [mode, type, objectSha] = record
      .subarray(0, tab)
      .toString('ascii')
      .split(' ');

    const path = decodeGitPath(record.subarray(tab + 1));

    if (
      !mode ||
      !type ||
      !/^[0-9a-f]{40,64}$/.test(objectSha ?? '')
    ) {
      throw new Error(`Invalid Git metadata: ${path}`);
    }

    const isSubmodule = mode === '160000' && type === 'commit';

    if (type !== 'blob' && !isSubmodule) {
      throw new Error(`Unsupported Git entry: ${path}`);
    }

    if (
      type === 'blob' &&
      !['100644', '100755', '120000'].includes(mode)
    ) {
      throw new Error(`Unsupported blob mode ${mode}: ${path}`);
    }

    const provenance = PROVENANCE_RULES
      .filter((rule) =>
        rule.patterns.some((pattern) => pattern.test(path))
      )
      .map((rule) => ({
        id: rule.id,
        status: rule.status,
        reason: rule.reason,
      }));

    if (
      /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(path)
    ) {
      provenance.push({
        id: 'LICENSE_DOCUMENT',
        status: 'PRESERVE',
        reason: 'License or attribution document.',
      });
    }

    if (provenance.length === 0) {
      provenance.push({
        id: 'UNASSESSED',
        status: 'NOT_REVIEWED',
        reason: 'File-level provenance has not been individually established.',
      });
    }

    records.push({
      path,
      mode,
      type,
      objectSha,
      sizeBytes: null,
      provenance,
      isSubmodule,
    });
  }

  if (start !== raw.length) {
    throw new Error('Incomplete NUL-terminated Git tree.');
  }

  if (records.length > CONFIG.maxEntries) {
    throw new Error(
      `Inventory exceeds entry limit: ${records.length}`
    );
  }

  return records;
}

async function preflightBlobSizes(repoDir, inventory) {
  const blobs = inventory.filter(
    (item) => !item.isSubmodule
  );

  const input = Buffer.from(
    blobs.map((item) => item.objectSha).join('\n') + '\n'
  );

  const result = await run(
    'git',
    [
      '-C',
      repoDir,
      'cat-file',
      '--batch-check=%(objectname) %(objecttype) %(objectsize)',
    ],
    { input }
  );

  const lines = result.stdout
    .toString('ascii')
    .trimEnd()
    .split('\n');

  if (lines.length !== blobs.length) {
    throw new Error('Git batch size response count mismatch.');
  }

  let totalBytes = 0;

  for (let i = 0; i < blobs.length; i += 1) {
    const [sha, type, sizeText] = lines[i].split(' ');

    if (
      sha !== blobs[i].objectSha ||
      type !== 'blob' ||
      !/^\d+$/.test(sizeText ?? '')
    ) {
      throw new Error(
        `Invalid Git blob metadata: ${blobs[i].path}`
      );
    }

    const size = Number(sizeText);

    if (
      !Number.isSafeInteger(size) ||
      size < 0 ||
      size > CONFIG.maxBlobBytes
    ) {
      throw new Error(
        `Blob size outside permitted range: ${blobs[i].path}`
      );
    }

    totalBytes += size;

    if (
      !Number.isSafeInteger(totalBytes) ||
      totalBytes > CONFIG.maxTotalBytes
    ) {
      throw new Error(
        'Total blob data exceeds the 2 GiB limit.'
      );
    }

    blobs[i].sizeBytes = size;
  }

  return {
    blobCount: blobs.length,
    totalBytes,
  };
}

async function gitBlobSha1File(path, expectedSize) {
  const hash = createHash('sha1').update(
    Buffer.from(`blob ${expectedSize}\0`)
  );

  let bytes = 0;

  for await (const chunk of createReadStream(path)) {
    bytes += chunk.length;
    hash.update(chunk);
  }

  if (bytes !== expectedSize) {
    throw new Error(
      `File size changed during hashing: ${path}`
    );
  }

  return hash.digest('hex');
}

async function sha256File(path) {
  const hash = createHash('sha256');

  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

function waitForChild(child, command, stderrChunks) {
  return new Promise((resolvePromise, reject) => {
    child.once('error', reject);

    child.once('close', (code, signal) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(
          `${command} exited with code ${code}${signal ? ` (signal ${signal})` : ''}\n` +
          Buffer.concat(stderrChunks).toString('utf8')
        ));
      }
    });
  });
}

async function exportRegularBlob(repoDir, item, destination) {
  const temporary = `${destination}.partial`;

  const child = spawn(
    'git',
    ['-C', repoDir, 'cat-file', 'blob', item.objectSha],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  const stderr = [];
  let stderrBytes = 0;

  child.stderr.on('data', (chunk) => {
    stderrBytes += chunk.length;

    if (stderrBytes <= CONFIG.maxStderrBytes) {
      stderr.push(chunk);
    } else {
      child.kill('SIGTERM');
    }
  });

  const closePromise = waitForChild(
    child,
    'git cat-file',
    stderr
  );

  try {
    await pipeline(
      child.stdout,
      createWriteStream(temporary, { flags: 'wx' })
    );

    await closePromise;

    const info = await stat(temporary);

    if (info.size !== item.sizeBytes) {
      throw new Error(`Export size mismatch: ${item.path}`);
    }

    if (
      await gitBlobSha1File(temporary, item.sizeBytes) !==
      item.objectSha
    ) {
      throw new Error(`Git blob SHA-1 mismatch: ${item.path}`);
    }

    await chmod(
      temporary,
      item.mode === '100755' ? 0o755 : 0o644
    );

    await rename(temporary, destination);
  } catch (error) {
    child.kill('SIGTERM');
    await closePromise.catch(() => {});
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}

async function exportSymlinkBlob(repoDir, item, destination) {
  if (item.sizeBytes > CONFIG.maxSymlinkBytes) {
    throw new Error(
      `Symlink target exceeds ${CONFIG.maxSymlinkBytes} bytes: ${item.path}`
    );
  }

  const result = await run(
    'git',
    ['-C', repoDir, 'cat-file', 'blob', item.objectSha]
  );

  const data = result.stdout;

  if (data.length !== item.sizeBytes) {
    throw new Error(`Symlink size mismatch: ${item.path}`);
  }

  const hash = createHash('sha1')
    .update(Buffer.from(`blob ${data.length}\0`))
    .update(data)
    .digest('hex');

  if (hash !== item.objectSha) {
    throw new Error(
      `Symlink blob hash mismatch: ${item.path}`
    );
  }

  if (data.length === 0 || data.includes(0)) {
    throw new Error(`Invalid symlink target: ${item.path}`);
  }

  // Buffer preserves the original target bytes.
  await symlink(data, destination);
}

async function exportGitTree(repoDir, snapshotDir, inventory) {
  let verifiedBlobCount = 0;
  let exportedBytes = 0;

  await mkdir(snapshotDir, { recursive: true });

  for (const item of inventory) {
    if (item.isSubmodule) continue;

    const destination = join(snapshotDir, item.path);

    await mkdir(dirname(destination), {
      recursive: true,
    });

    if (item.mode === '120000') {
      await exportSymlinkBlob(
        repoDir,
        item,
        destination
      );
    } else {
      await exportRegularBlob(
        repoDir,
        item,
        destination
      );
    }

    verifiedBlobCount += 1;
    exportedBytes += item.sizeBytes;
  }

  return {
    verifiedBlobCount,
    exportedBytes,
  };
}

async function verifyExtractedTree(root, inventory) {
  const expected = new Map(
    inventory
      .filter((item) => !item.isSubmodule)
      .map((item) => [item.path, item])
  );

  const actualFiles = new Set();
  const actualDirs = new Set();

  async function walk(directory, prefix = '') {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const relative = prefix
        ? `${prefix}/${entry.name}`
        : entry.name;

      const full = join(directory, entry.name);
      const info = await lstat(full);

      if (info.isDirectory()) {
        actualDirs.add(relative);
        await walk(full, relative);
      } else if (info.isFile() || info.isSymbolicLink()) {
        actualFiles.add(relative);
      } else {
        throw new Error(
          `Unexpected special file in archive: ${relative}`
        );
      }
    }
  }

  await walk(root);

  const requiredDirs = new Set();

  for (const path of expected.keys()) {
    const parts = path.split('/');

    for (let i = 1; i < parts.length; i += 1) {
      requiredDirs.add(
        parts.slice(0, i).join('/')
      );
    }
  }

  for (const path of expected.keys()) {
    if (!actualFiles.has(path)) {
      throw new Error(`Archive missing file: ${path}`);
    }
  }

  for (const path of actualFiles) {
    if (!expected.has(path)) {
      throw new Error(`Unexpected archive file: ${path}`);
    }
  }

  for (const path of requiredDirs) {
    if (!actualDirs.has(path)) {
      throw new Error(`Archive missing directory: ${path}`);
    }
  }

  for (const path of actualDirs) {
    if (!requiredDirs.has(path)) {
      throw new Error(`Unexpected archive directory: ${path}`);
    }
  }

  let verifiedBytes = 0;

  for (const [path, item] of expected) {
    const full = join(root, path);
    const info = await lstat(full);

    if (item.mode === '120000') {
      if (!info.isSymbolicLink()) {
        throw new Error(`Expected symlink: ${path}`);
      }

      const target = await readlink(full, {
        encoding: 'buffer',
      });

      if (target.length !== item.sizeBytes) {
        throw new Error(
          `Archive symlink size mismatch: ${path}`
        );
      }

      const hash = createHash('sha1')
        .update(Buffer.from(`blob ${target.length}\0`))
        .update(target)
        .digest('hex');

      if (hash !== item.objectSha) {
        throw new Error(
          `Archive symlink content mismatch: ${path}`
        );
      }
    } else {
      if (!info.isFile()) {
        throw new Error(`Expected regular file: ${path}`);
      }

      if (info.size !== item.sizeBytes) {
        throw new Error(
          `Archive file size mismatch: ${path}`
        );
      }

      if (
        await gitBlobSha1File(full, item.sizeBytes) !==
        item.objectSha
      ) {
        throw new Error(
          `Archive content mismatch: ${path}`
        );
      }

      const executable = (info.mode & 0o111) !== 0;

      if (executable !== (item.mode === '100755')) {
        throw new Error(
          `Archive permission mismatch: ${path}`
        );
      }
    }

    verifiedBytes += item.sizeBytes;
  }

  return {
    verifiedFiles: expected.size,
    verifiedBytes,
  };
}

async function publishTransaction(stageDir, outputDir, names) {
  const backupDir = join(stageDir, 'backup');

  await mkdir(backupDir, { recursive: true });

  const backedUp = new Set();
  const installed = new Set();

  try {
    for (const name of names) {
      const target = join(outputDir, name);

      try {
        const info = await lstat(target);

        if (!info.isFile()) {
          throw new Error(
            `Existing output is not a regular file: ${name}`
          );
        }

        await rename(
          target,
          join(backupDir, name)
        );

        backedUp.add(name);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }

    for (const name of names) {
      await rename(
        join(stageDir, name),
        join(outputDir, name)
      );

      installed.add(name);
    }
  } catch (publishError) {
    const rollbackErrors = [];

    for (const name of [...names].reverse()) {
      const target = join(outputDir, name);
      const backup = join(backupDir, name);

      try {
        if (backedUp.has(name)) {
          await rm(target, {
            force: true,
            recursive: false,
          });

          await rename(backup, target);
        } else if (installed.has(name)) {
          await rm(target, {
            force: true,
            recursive: false,
          });
        }
      } catch (rollbackError) {
        rollbackErrors.push(
          `${name}: ${rollbackError.message}`
        );
      }
    }

    if (rollbackErrors.length > 0) {
      const error = new Error(
        `Rollback incomplete. Backup retained at ${backupDir}. ` +
        `Publish error: ${publishError.message}. ` +
        `Rollback errors: ${rollbackErrors.join(' | ')}`
      );

      error.preserveStage = true;
      throw error;
    }

    throw new Error(
      `Publish failed; rollback completed: ${publishError.message}`
    );
  }
}

async function writeJson(path, value) {
  await writeFile(
    path,
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );
}

async function main() {
  if (
    Number(process.versions.node.split('.')[0]) < 20
  ) {
    throw new Error('Node.js 20 or newer is required.');
  }

  const output = CONFIG.outputDirectory;

  await mkdir(output, { recursive: true });

  const outputInfo = await lstat(output);

  if (!outputInfo.isDirectory() || outputInfo.isSymbolicLink()) {
    throw new Error(
      'Output path must be a real directory, not a symlink.'
    );
  }

  const startedAt = new Date().toISOString();

  const workDir = await mkdtemp(
    join(tmpdir(), 'samantha-preserve-v301-')
  );

  const stageDir = await mkdtemp(
    join(output, '.preserve-stage-')
  );

  let preserveStage = false;

  const repoDir = join(workDir, 'repo');
  const snapshotParent = join(workDir, 'snapshot');

  const snapshotDir = join(
    snapshotParent,
    `${CONFIG.repositoryName}-${CONFIG.sdkVersion}`
  );

  const verifyParent = join(workDir, 'verify');

  const verifyDir = join(
    verifyParent,
    `${CONFIG.repositoryName}-${CONFIG.sdkVersion}`
  );

  const stem =
    `thetowersdk-${CONFIG.sdkVersion}-` +
    CONFIG.commit.slice(0, 12);

  const archiveName = `${stem}.tar.gz`;
  const bundleName = `${stem}.bundle`;

  const names = [
    bundleName,
    archiveName,
    'manifest.json',
    'preservation-report.md',
  ];

  try {
    console.log(
      `Samantha TheTowerSDK Preservation v${SCRIPT_VERSION}`
    );

    console.log(
      `SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`
    );

    console.log(`Commit: ${CONFIG.commit}`);

    console.log(
      '[1/12] Initialize temporary Git repository'
    );

    await run('git', ['init', repoDir]);

    await run('git', [
      '-C',
      repoDir,
      'remote',
      'add',
      'origin',
      CONFIG.repository,
    ]);

    console.log('[2/12] Fetch exact upstream commit');

    await run('git', [
      '-C',
      repoDir,
      'fetch',
      '--no-tags',
      'origin',
      CONFIG.commit,
    ]);

    const commit = (
      await run('git', [
        '-C',
        repoDir,
        'rev-parse',
        'FETCH_HEAD^{commit}',
      ])
    ).stdout.toString('ascii').trim();

    if (commit !== CONFIG.commit) {
      throw new Error('Fetched commit SHA mismatch.');
    }

    const treeSha = (
      await run('git', [
        '-C',
        repoDir,
        'rev-parse',
        `${commit}^{tree}`,
      ])
    ).stdout.toString('ascii').trim();

    console.log('[3/12] Verify SDK package metadata');

    const packageJson = JSON.parse(
      (
        await run('git', [
          '-C',
          repoDir,
          'show',
          `${commit}:package.json`,
        ])
      ).stdout.toString('utf8')
    );

    if (
      packageJson.name !== CONFIG.packageName ||
      packageJson.version !== CONFIG.sdkVersion
    ) {
      throw new Error(
        'SDK package name/version mismatch.'
      );
    }

    console.log('[4/12] Build recursive Git inventory');

    const rawTree = await run('git', [
      '-C',
      repoDir,
      'ls-tree',
      '-r',
      '-z',
      '--full-tree',
      commit,
    ]);

    const inventory = parseTree(rawTree.stdout);

    if (inventory.length === 0) {
      throw new Error('Inventory is empty.');
    }

    console.log('[5/12] Preflight all blob sizes');

    const preflight = await preflightBlobSizes(
      repoDir,
      inventory
    );

    const submodules = inventory.filter(
      (item) => item.isSubmodule
    );

    console.log(
      `Inventory entries: ${inventory.length}; bytes: ${preflight.totalBytes}`
    );

    console.log('[6/12] Create and verify Git bundle');

    const ref = 'refs/heads/samantha-preserved-sdk';

    await run('git', [
      '-C',
      repoDir,
      'update-ref',
      ref,
      commit,
    ]);

    const stagedBundle = join(stageDir, bundleName);

    await run('git', [
      '-C',
      repoDir,
      'bundle',
      'create',
      stagedBundle,
      ref,
    ]);

    await run('git', [
      '-C',
      repoDir,
      'bundle',
      'verify',
      stagedBundle,
    ]);

    const bundleSha256 = await sha256File(stagedBundle);
    const bundleBytes = (await stat(stagedBundle)).size;

    if (bundleBytes === 0) {
      throw new Error('Git bundle is empty.');
    }

    console.log(
      '[7/12] Export Git blobs with streaming hash verification'
    );

    const exportResult = await exportGitTree(
      repoDir,
      snapshotDir,
      inventory
    );

    if (
      exportResult.verifiedBlobCount !== preflight.blobCount
    ) {
      throw new Error(
        'Exported blob count differs from preflight inventory.'
      );
    }

    console.log('[8/12] Create deterministic source archive');

    const stagedArchive = join(stageDir, archiveName);

    await run('tar', [
      '--sort=name',
      '--mtime=@0',
      '--owner=0',
      '--group=0',
      '--numeric-owner',
      '-czf',
      stagedArchive,
      '-C',
      snapshotParent,
      basename(snapshotDir),
    ]);

    await run('gzip', ['-t', stagedArchive]);
    await run('tar', ['-tzf', stagedArchive]);

    console.log(
      '[9/12] Extract archive and compare every entry'
    );

    await mkdir(verifyParent, { recursive: true });

    await run('tar', [
      '-xzf',
      stagedArchive,
      '-C',
      verifyParent,
    ]);

    const archiveVerification = await verifyExtractedTree(
      verifyDir,
      inventory
    );

    const archiveSha256 = await sha256File(stagedArchive);
    const archiveBytes = (await stat(stagedArchive)).size;

    if (archiveBytes === 0) {
      throw new Error('Source archive is empty.');
    }

    console.log(
      '[10/12] Build manifest and preservation report'
    );

    const inventorySha256 = createHash('sha256')
      .update(JSON.stringify(inventory))
      .digest('hex');

    const licenseFiles = inventory
      .filter((item) =>
        /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(item.path)
      )
      .map((item) => item.path);

    const flagged = inventory.filter((item) =>
      item.provenance.some((p) =>
        p.status === 'CLARIFICATION_REQUIRED' ||
        p.status === 'LICENSE_REVIEW'
      )
    );

    const notReviewed = inventory.filter((item) =>
      item.provenance.some((p) =>
        p.status === 'NOT_REVIEWED'
      )
    );

    const manifest = {
      schemaVersion: '1.0.0',

      preservation: {
        status: 'SNAPSHOT_CREATED',
        scriptVersion: SCRIPT_VERSION,
        startedAt,
        completedAt: new Date().toISOString(),
      },

      source: {
        repository: CONFIG.repository,
        repositoryName: CONFIG.repositoryName,
        packageName: packageJson.name,
        sdkVersion: packageJson.version,
        gameVersion: CONFIG.gameVersion,
        commit,
        gitTreeSha: treeSha,
        packageLicense: packageJson.license ?? null,
        nodeRequirement: packageJson.engines?.node ?? null,
      },

      gitBundle: {
        file: bundleName,
        sizeBytes: bundleBytes,
        sha256: bundleSha256,
        verification: 'PASSED',
        scope: 'Commit and history reachable from fetched commit; not all upstream branches or tags.',
      },

      archive: {
        file: archiveName,
        format: 'tar.gz',
        sizeBytes: archiveBytes,
        sha256: archiveSha256,
        gzipTest: 'PASSED',
        extractionTest: 'PASSED',
        verifiedFiles: archiveVerification.verifiedFiles,
        verifiedBytes: archiveVerification.verifiedBytes,
        comparison: 'Every archived regular file and symlink was compared against its Git blob SHA-1.',
      },

      inventory: {
        totalEntries: inventory.length,
        blobCount: preflight.blobCount,
        verifiedBlobCount: exportResult.verifiedBlobCount,
        exportedBytes: exportResult.exportedBytes,
        inventorySha256,
        licenseDocuments: licenseFiles,
        submoduleReferenceCount: submodules.length,
        flaggedFileCount: flagged.length,
        notReviewedFileCount: notReviewed.length,
        entries: inventory,
      },

      licensing: {
        overallStatus: 'REVIEW_REQUIRED',
        publicRedistributionApproved: false,
        notes: [
          'Submodule contents are not included; only gitlink references are recorded.',
          'File-level provenance classification is preliminary and pattern-based.',
          'NOT_REVIEWED does not mean license-free.',
          'Public redistribution is not approved.',
        ],
      },

      execution: {
        sdkInstalled: false,
        sdkCodeExecuted: false,
        runtimeTests: 'NOT_RUN',
      },
    };

    await writeJson(
      join(stageDir, 'manifest.json'),
      manifest
    );

    const report = [
      '# TheTowerSDK Preservation Report',
      '',
      `- Preservation script: v${SCRIPT_VERSION}`,
      `- SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`,
      `- Commit: ${commit}`,
      `- Git tree SHA: ${treeSha}`,
      `- Git bundle: ${bundleName}`,
      `- Git bundle SHA-256: ${bundleSha256}`,
      `- Source archive: ${archiveName}`,
      `- Archive SHA-256: ${archiveSha256}`,
      `- Inventory entries: ${inventory.length}`,
      `- Verified blobs: ${exportResult.verifiedBlobCount}`,
      `- Archive files verified: ${archiveVerification.verifiedFiles}`,
      `- Inventory SHA-256: ${inventorySha256}`,
      `- License documents: ${licenseFiles.length}`,
      `- Submodule references: ${submodules.length}`,
      `- Files requiring license review: ${flagged.length}`,
      `- Files not individually reviewed: ${notReviewed.length}`,
      '',
      '## License documents',
      ...licenseFiles.map((path) => `- ${path}`),
      '',
      '## Files requiring license review',
      ...flagged.map((item) =>
        `- ${item.path}: ${item.provenance.map((p) => p.id).join(', ')}`
      ),
      '',
      '## Submodule references',
      ...submodules.map((item) =>
        `- ${item.path}: ${item.objectSha}`
      ),
      '',
      '## Limitations',
      '- Submodule contents are not included.',
      '- Non-UTF-8 Git paths are rejected rather than silently altered.',
      '- Git bundle does not represent all upstream branches or tags.',
      '- Individual provenance review remains incomplete.',
      '- Public redistribution is not approved.',
      '- SDK runtime tests have not been performed.',
    ].join('\n');

    await writeFile(
      join(stageDir, 'preservation-report.md'),
      `${report}\n`,
      'utf8'
    );

    console.log(
      '[11/12] Publish outputs with rollback protection'
    );

    await publishTransaction(
      stageDir,
      output,
      names
    );

    console.log('[12/12] Preservation completed');

    console.log(`Git bundle SHA-256: ${bundleSha256}`);
    console.log(`Archive SHA-256: ${archiveSha256}`);
    console.log(`Inventory entries: ${inventory.length}`);
    console.log(`Verified blobs: ${exportResult.verifiedBlobCount}`);
    console.log('Archive-to-inventory comparison: PASSED');
    console.log('Status: SNAPSHOT_CREATED');
    console.log('SDK runtime tests: NOT RUN');
    console.log('Public redistribution: NOT APPROVED');
  } catch (error) {
    if (error?.preserveStage) preserveStage = true;
    throw error;
  } finally {
    await rm(workDir, {
      recursive: true,
      force: true,
    }).catch((error) => {
      console.error(
        `WARNING: could not remove temporary work directory: ${error.message}`
      );
    });

    if (!preserveStage) {
      await rm(stageDir, {
        recursive: true,
        force: true,
      }).catch((error) => {
        console.error(
          `WARNING: could not remove staging directory: ${error.message}`
        );
      });
    }
  }
}

main().catch((error) => {
  if (error?.preserveStage) {
    console.error(
      'IMPORTANT: incomplete rollback; recovery backup was retained.'
    );
  }

  console.error('\nPRESERVATION FAILED');
  console.error(error);
  process.exitCode = 1;
});
