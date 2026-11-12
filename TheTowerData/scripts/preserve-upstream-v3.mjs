
#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation v3.0
 * Node.js >= 20, Git, GNU tar, gzip
 * Does not install or execute SDK code.
 */

import {
  mkdir, writeFile, rm, rename, stat, lstat,
  chmod, symlink, readlink, readdir, mkdtemp
} from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve, basename, dirname } from "node:path";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";


const CONFIG = {
  repository: "https://github.com/TmRxJD/TheTowerSDK.git",
  repositoryName: "TheTowerSDK",
  packageName: "thetowersdk",
  sdkVersion: "0.14.1",
  gameVersion: null,
  commit: "9a95672578fa064d71ddd54fad2ce5027a310b3a",

  maxBlobBytes: 128 * 1024 * 1024,
  maxTotalBytes: 2 * 1024 * 1024 * 1024,
  maxEntries: 100000,
  maxSymlinkBytes: 4096,
  maxCommandOutputBytes: 64 * 1024 * 1024,

  outputDirectory: resolve(
    process.argv[2] ??
    "TheTowerData/staging/thetowersdk/0.14.1"
  )
};


const PROVENANCE_RULES = [
  {
    id: "EFFECTIVE_PATHS",
    patterns: [/effective-paths/i, /effective.paths/i],
    status: "CLARIFICATION_REQUIRED",
    reason: "Community spreadsheet-derived material; redistribution scope requires clarification."
  },
  {
    id: "ORPHIS",
    patterns: [
      /labs-categories\.generated/i,
      /lab-categories\.json/i
    ],
    status: "CLARIFICATION_REQUIRED",
    reason: "Orphis-related material; redistribution terms require clarification."
  },
  {
    id: "TOWER_IDLE_TOOLKIT",
    patterns: [
      /base-empirical-scaling/i,
      /scaling-regression-profile/i,
      /mechanics\/combat\/damage/i,
      /mechanics\/combat\/bonuses/i,
      /formatting\/duration/i
    ],
    status: "LICENSE_REVIEW",
    reason: "Potential tower-idle-toolkit-derived material; verify applicable attribution."
  }
];


function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options
    });

    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let settled = false;

    child.stdout?.on("data", chunk => {
      outputBytes += chunk.length;

      if (outputBytes > CONFIG.maxCommandOutputBytes) {
        child.kill("SIGTERM");

        if (!settled) {
          settled = true;
          reject(new Error(
            command + " exceeded command output limit."
          ));
        }

        return;
      }

      stdout.push(chunk);
    });

    child.stderr?.on("data", chunk => stderr.push(chunk));

    child.on("error", error => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.on("close", code => {
      if (settled) return;
      settled = true;

      if (code !== 0) {
        reject(new Error(
          command + " exited with code " + code + "\n" +
          Buffer.concat(stderr).toString("utf8")
        ));
      } else {
        resolvePromise({
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr)
        });
      }
    });
  });
}


function decodeGitPath(buffer) {
  const value = new TextDecoder("utf-8", {
    fatal: true
  }).decode(buffer);

  if (!Buffer.from(value, "utf8").equals(buffer)) {
    throw new Error("Git path is not losslessly UTF-8.");
  }

  if (
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.split("/").some(part =>
      !part || part === "." || part === ".."
    )
  ) {
    throw new Error("Unsafe Git path: " + value);
  }

  return value;
}


function parseTree(raw) {
  const records = [];
  let start = 0;

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== 0) continue;

    const record = raw.subarray(start, i);
    start = i + 1;

    if (!record.length) continue;

    const tab = record.indexOf(9);

    if (tab < 0) {
      throw new Error("Invalid Git tree record.");
    }

    const [mode, type, objectSha] =
      record.subarray(0, tab)
        .toString("ascii")
        .split(" ");

    const path = decodeGitPath(
      record.subarray(tab + 1)
    );

    if (!mode || !type || !objectSha) {
      throw new Error("Invalid Git metadata: " + path);
    }

    if (
      type !== "blob" &&
      !(mode === "160000" && type === "commit")
    ) {
      throw new Error("Unsupported Git entry: " + path);
    }

    const provenance = PROVENANCE_RULES
      .filter(rule =>
        rule.patterns.some(pattern => pattern.test(path))
      )
      .map(rule => ({
        id: rule.id,
        status: rule.status,
        reason: rule.reason
      }));

    if (
      /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(path)
    ) {
      provenance.push({
        id: "LICENSE_DOCUMENT",
        status: "PRESERVE",
        reason: "License or attribution document."
      });
    }

    if (!provenance.length) {
      provenance.push({
        id: "UNASSESSED",
        status: "NOT_REVIEWED",
        reason: "File-level provenance has not been individually established."
      });
    }

    records.push({
      path,
      mode,
      type,
      objectSha,
      sizeBytes: null,
      provenance,
      isSubmodule: mode === "160000"
    });
  }

  if (start !== raw.length) {
    throw new Error("Incomplete NUL-terminated Git tree.");
  }

  return records;
}


async function preflightBlobSizes(repoDir, inventory) {
  if (inventory.length > CONFIG.maxEntries) {
    throw new Error(
      "Inventory exceeds limit: " + inventory.length
    );
  }

  let totalBytes = 0;
  let blobCount = 0;

  for (const item of inventory) {
    if (item.isSubmodule) continue;

    const result = await run("git", [
      "-C", repoDir,
      "cat-file", "-s", item.objectSha
    ]);

    const value = result.stdout.toString("ascii").trim();

    if (!/^\d+$/.test(value)) {
      throw new Error("Invalid blob size: " + item.path);
    }

    const size = Number(value);

    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error("Unsafe blob size: " + item.path);
    }

    if (size > CONFIG.maxBlobBytes) {
      throw new Error(
        "Blob exceeds per-file limit: " + item.path
      );
    }

    totalBytes += size;

    if (
      !Number.isSafeInteger(totalBytes) ||
      totalBytes > CONFIG.maxTotalBytes
    ) {
      throw new Error("Total blob data exceeds 2 GiB limit.");
    }

    item.sizeBytes = size;
    blobCount++;
  }

  return { blobCount, totalBytes };
}


async function gitBlobSha1File(path, expectedSize) {
  const hash = createHash("sha1")
    .update(Buffer.from("blob " + expectedSize + "\0"));

  let bytes = 0;

  for await (const chunk of createReadStream(path)) {
    bytes += chunk.length;
    hash.update(chunk);
  }

  if (bytes !== expectedSize) {
    throw new Error("File size changed during hashing: " + path);
  }

  return hash.digest("hex");
}


async function sha256File(path) {
  const hash = createHash("sha256");

  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}


async function exportRegularBlob(repoDir, item, destination) {
  const temporary = destination + ".partial";

  const child = spawn("git", [
    "-C", repoDir,
    "cat-file", "blob", item.objectSha
  ], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  const stderr = [];
  let spawnError = null;

  child.stderr.on("data", chunk => stderr.push(chunk));
  child.on("error", error => {
    spawnError = error;
  });

  const closePromise = new Promise(resolvePromise => {
    child.once("close", code => resolvePromise(code));
  });

  try {
    await pipeline(
      child.stdout,
      createWriteStream(temporary, { flags: "wx" })
    );

    const code = await closePromise;

    if (spawnError) throw spawnError;

    if (code !== 0) {
      throw new Error(
        "git cat-file failed: " +
        Buffer.concat(stderr).toString("utf8")
      );
    }

    const info = await stat(temporary);

    if (info.size !== item.sizeBytes) {
      throw new Error("Export size mismatch: " + item.path);
    }

    const hash = await gitBlobSha1File(
      temporary,
      item.sizeBytes
    );

    if (hash !== item.objectSha) {
      throw new Error("Git blob SHA-1 mismatch: " + item.path);
    }

    await chmod(
      temporary,
      item.mode === "100755" ? 0o755 : 0o644
    );

    await rename(temporary, destination);

  } catch (error) {
    child.kill("SIGTERM");
    await closePromise;
    await rm(temporary, { force: true });
    throw error;
  }
}


async function exportSymlinkBlob(repoDir, item, destination) {
  if (item.sizeBytes > CONFIG.maxSymlinkBytes) {
    throw new Error("Symlink target too large: " + item.path);
  }

  const result = await run("git", [
    "-C", repoDir,
    "cat-file", "blob", item.objectSha
  ]);

  const data = result.stdout;

  if (data.length !== item.sizeBytes) {
    throw new Error("Symlink size mismatch: " + item.path);
  }

  const hash = createHash("sha1")
    .update(Buffer.from("blob " + data.length + "\0"))
    .update(data)
    .digest("hex");

  if (hash !== item.objectSha) {
    throw new Error("Symlink blob hash mismatch: " + item.path);
  }

  const target = new TextDecoder("utf-8", {
    fatal: true
  }).decode(data);

  if (!target || target.includes("\0")) {
    throw new Error("Invalid symlink target: " + item.path);
  }

  await symlink(target, destination);
}


async function exportGitTree(repoDir, snapshotDir, inventory) {
  let verifiedBlobCount = 0;
  let exportedBytes = 0;

  await mkdir(snapshotDir, { recursive: true });

  for (const item of inventory) {
    if (item.isSubmodule) continue;

    const destination = join(snapshotDir, item.path);

    await mkdir(dirname(destination), {
      recursive: true
    });

    if (item.mode === "120000") {
      await exportSymlinkBlob(repoDir, item, destination);

    } else if (
      item.mode === "100644" ||
      item.mode === "100755"
    ) {
      await exportRegularBlob(repoDir, item, destination);

    } else {
      throw new Error(
        "Unsupported file mode " + item.mode + ": " + item.path
      );
    }

    verifiedBlobCount++;
    exportedBytes += item.sizeBytes;
  }

  return { verifiedBlobCount, exportedBytes };
}


async function verifyExtractedTree(root, inventory) {
  const expected = new Map();

  for (const item of inventory) {
    if (!item.isSubmodule) {
      expected.set(item.path, item);
    }
  }

  const actualFiles = new Set();
  const actualDirs = new Set();

  async function walk(directory, prefix = "") {
    const entries = await readdir(directory, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const rel = prefix
        ? prefix + "/" + entry.name
        : entry.name;

      const full = join(directory, entry.name);
      const info = await lstat(full);

      if (info.isDirectory()) {
        actualDirs.add(rel);
        await walk(full, rel);
      } else {
        actualFiles.add(rel);
      }
    }
  }

  await walk(root);

  const requiredDirs = new Set();

  for (const path of expected.keys()) {
    const parts = path.split("/");

    for (let i = 1; i < parts.length; i++) {
      requiredDirs.add(parts.slice(0, i).join("/"));
    }
  }

  for (const path of expected.keys()) {
    if (!actualFiles.has(path)) {
      throw new Error("Archive missing file: " + path);
    }
  }

  for (const path of actualFiles) {
    if (!expected.has(path)) {
      throw new Error("Unexpected archive file: " + path);
    }
  }

  for (const path of requiredDirs) {
    if (!actualDirs.has(path)) {
      throw new Error("Archive missing directory: " + path);
    }
  }

  for (const path of actualDirs) {
    if (!requiredDirs.has(path)) {
      throw new Error("Unexpected archive directory: " + path);
    }
  }

  let verifiedBytes = 0;

  for (const [path, item] of expected) {
    const full = join(root, path);
    const info = await lstat(full);

    if (item.mode === "120000") {
      if (!info.isSymbolicLink()) {
        throw new Error("Expected symlink: " + path);
      }

      const target = Buffer.from(await readlink(full), "utf8");

      if (target.length !== item.sizeBytes) {
        throw new Error("Symlink size mismatch: " + path);
      }

      const hash = createHash("sha1")
        .update(Buffer.from("blob " + target.length + "\0"))
        .update(target)
        .digest("hex");

      if (hash !== item.objectSha) {
        throw new Error("Symlink content mismatch: " + path);
      }

    } else {
      if (!info.isFile()) {
        throw new Error("Expected regular file: " + path);
      }

      if (info.size !== item.sizeBytes) {
        throw new Error("Archive file size mismatch: " + path);
      }

      const hash = await gitBlobSha1File(full, item.sizeBytes);

      if (hash !== item.objectSha) {
        throw new Error("Archive content mismatch: " + path);
      }

      const executable = (info.mode & 0o111) !== 0;

      if (executable !== (item.mode === "100755")) {
        throw new Error("Archive permission mismatch: " + path);
      }
    }

    verifiedBytes += item.sizeBytes;
  }

  return {
    verifiedFiles: expected.size,
    verifiedBytes
  };
}


async function publishTransaction(stageDir, outputDir, names) {
  const backupDir = join(stageDir, "backup");

  await mkdir(backupDir, { recursive: true });

  const backedUp = new Set();
  const installed = new Set();

  try {
    // Move old outputs to backup before publishing anything.
    for (const name of names) {
      const target = join(outputDir, name);

      try {
        const info = await lstat(target);

        if (!info.isFile()) {
          throw new Error(
            "Existing output is not a regular file: " + name
          );
        }

        await rename(target, join(backupDir, name));
        backedUp.add(name);

      } catch (error) {
        if (error.code !== "ENOENT") throw error;
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
            recursive: false
          });

          await rename(backup, target);

        } else if (installed.has(name)) {
          await rm(target, {
            force: true,
            recursive: false
          });
        }

      } catch (rollbackError) {
        rollbackErrors.push(
          name + ": " + rollbackError.message
        );
      }
    }

    if (rollbackErrors.length) {
      const error = new Error(
        "Rollback incomplete. Backup retained at " +
        backupDir + ". Original: " + publishError.message +
        ". Rollback errors: " + rollbackErrors.join(" | ")
      );

      error.preserveStage = true;
      throw error;
    }

    throw new Error(
      "Publish failed; rollback completed: " +
      publishError.message
    );
  }
}


async function main() {
  if (Number(process.versions.node.split(".")[0]) < 20) {
    throw new Error("Node.js 20 or newer is required.");
  }

  const startedAt = new Date().toISOString();
  const output = CONFIG.outputDirectory;

  await mkdir(output, { recursive: true });

  const workDir = await mkdtemp(
    join(tmpdir(), "samantha-preserve-v311-")
  );

  const stageDir = await mkdtemp(
    join(output, ".preserve-stage-")
  );

  let preserveStage = false;

  const repoDir = join(workDir, "repo");
  const snapshotParent = join(workDir, "snapshot");
  const snapshotDir = join(
    snapshotParent,
    CONFIG.repositoryName + "-" + CONFIG.sdkVersion
  );

  const verifyParent = join(workDir, "verify");
  const verifyDir = join(
    verifyParent,
    CONFIG.repositoryName + "-" + CONFIG.sdkVersion
  );

  const stem =
    "thetowersdk-" + CONFIG.sdkVersion + "-" +
    CONFIG.commit.slice(0, 12);

  const archiveName = stem + ".tar.gz";
  const bundleName = stem + ".bundle";

  const names = [
    bundleName,
    archiveName,
    "manifest.json",
    "preservation-report.md"
  ];

  try {
    console.log("Samantha TheTowerSDK Preservation v3.1.1");
    console.log("SDK: " + CONFIG.packageName + "@" + CONFIG.sdkVersion);
    console.log("Commit: " + CONFIG.commit);

    console.log("[1/12] Initialize temporary repository");

    await run("git", ["init", repoDir]);

    await run("git", [
      "-C", repoDir,
      "remote", "add", "origin",
      CONFIG.repository
    ]);

    console.log("[2/12] Fetch exact upstream commit");

    await run("git", [
      "-C", repoDir,
      "fetch", "origin", CONFIG.commit
    ]);

    const commit = (
      await run("git", [
        "-C", repoDir,
        "rev-parse",
        "FETCH_HEAD^{commit}"
      ])
    ).stdout.toString("utf8").trim();

    if (commit !== CONFIG.commit) {
      throw new Error("Fetched commit SHA mismatch.");
    }

    const treeSha = (
      await run("git", [
        "-C", repoDir,
        "rev-parse",
        commit + "^{tree}"
      ])
    ).stdout.toString("utf8").trim();

    console.log("[3/12] Verify package metadata");

    const packageJson = JSON.parse(
      (
        await run("git", [
          "-C", repoDir,
          "show",
          commit + ":package.json"
        ])
      ).stdout.toString("utf8")
    );

    if (
      packageJson.name !== CONFIG.packageName ||
      packageJson.version !== CONFIG.sdkVersion
    ) {
      throw new Error("SDK package name/version mismatch.");
    }

    console.log("[4/12] Build recursive inventory");

    const rawTree = await run("git", [
      "-C", repoDir,
      "ls-tree", "-r", "-z", "--full-tree", commit
    ]);

    const inventory = parseTree(rawTree.stdout);

    if (!inventory.length) {
      throw new Error("Inventory is empty.");
    }

    console.log("[5/12] Preflight blob sizes");

    const preflight = await preflightBlobSizes(
      repoDir,
      inventory
    );

    const submodules = inventory.filter(
      item => item.isSubmodule
    );

    console.log("Preflight bytes: " + preflight.totalBytes);

    console.log("[6/12] Create and verify Git bundle");

    const ref = "refs/heads/samantha-preserved-sdk";

    await run("git", [
      "-C", repoDir,
      "update-ref", ref, commit
    ]);

    const stagedBundle = join(stageDir, bundleName);

    await run("git", [
      "-C", repoDir,
      "bundle", "create", stagedBundle, ref
    ]);

    await run("git", [
      "-C", repoDir,
      "bundle", "verify", stagedBundle
    ]);

    const bundleSha256 = await sha256File(stagedBundle);
    const bundleBytes = (await stat(stagedBundle)).size;

    if (!bundleBytes) {
      throw new Error("Git bundle is empty.");
    }

    console.log("[7/12] Export blobs using streaming");

    const exportResult = await exportGitTree(
      repoDir,
      snapshotDir,
      inventory
    );

    if (
      exportResult.verifiedBlobCount !== preflight.blobCount ||
      exportResult.exportedBytes !== preflight.totalBytes
    ) {
      throw new Error("Export totals differ from preflight.");
    }

    console.log("[8/12] Create source archive");

    const stagedArchive = join(stageDir, archiveName);

    await run("tar", [
      "--sort=name",
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "-czf",
      stagedArchive,
      "-C",
      snapshotParent,
      basename(snapshotDir)
    ]);

    await run("gzip", ["-t", stagedArchive]);

    console.log("[9/12] Extract and verify archive");

    await mkdir(verifyParent, { recursive: true });

    await run("tar", [
      "--no-same-owner",
      "--no-same-permissions",
      "-xzf",
      stagedArchive,
      "-C",
      verifyParent
    ]);

    const archiveVerification = await verifyExtractedTree(
      verifyDir,
      inventory
    );

    if (
      archiveVerification.verifiedBytes !== preflight.totalBytes
    ) {
      throw new Error("Archive verified byte total mismatch.");
    }

    const archiveSha256 = await sha256File(stagedArchive);
    const archiveBytes = (await stat(stagedArchive)).size;

    if (!archiveBytes) {
      throw new Error("Source archive is empty.");
    }

    console.log("[10/12] Build manifest and report");

    const inventorySha256 = createHash("sha256")
      .update(JSON.stringify(inventory))
      .digest("hex");

    const licenseFiles = inventory
      .filter(item =>
        /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(item.path)
      )
      .map(item => item.path);

    const flagged = inventory.filter(item =>
      item.provenance.some(p =>
        p.status === "CLARIFICATION_REQUIRED" ||
        p.status === "LICENSE_REVIEW"
      )
    );

    const notReviewed = inventory.filter(item =>
      item.provenance.some(p =>
        p.status === "NOT_REVIEWED"
      )
    );

    const manifest = {
      schemaVersion: "1.0.0",

      preservation: {
        status: "SNAPSHOT_CREATED",
        scriptVersion: "3.1.1",
        startedAt,
        completedAt: new Date().toISOString()
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
        nodeRequirement: packageJson.engines?.node ?? null
      },

      limits: {
        maxBlobBytes: CONFIG.maxBlobBytes,
        maxTotalBytes: CONFIG.maxTotalBytes,
        maxEntries: CONFIG.maxEntries,
        maxSymlinkBytes: CONFIG.maxSymlinkBytes,
        preflightTotalBytes: preflight.totalBytes
      },

      gitBundle: {
        file: bundleName,
        sizeBytes: bundleBytes,
        sha256: bundleSha256,
        verification: "PASSED",
        scope:
          "Commit and history reachable from fetched commit; not all upstream branches or tags."
      },

      archive: {
        file: archiveName,
        format: "tar.gz",
        sizeBytes: archiveBytes,
        sha256: archiveSha256,
        gzipTest: "PASSED",
        extractionTest: "PASSED",
        verifiedFiles: archiveVerification.verifiedFiles,
        verifiedBytes: archiveVerification.verifiedBytes,
        comparison:
          "Every extracted file and symlink compared against its Git blob SHA-1."
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
        entries: inventory
      },

      licensing: {
        overallStatus: "REVIEW_REQUIRED",
        publicRedistributionApproved: false,
        notes: [
          "Submodule contents are not included; only gitlink references are recorded.",
          "File-level provenance classification is preliminary.",
          "NOT_REVIEWED does not mean license-free.",
          "Public redistribution is not approved."
        ]
      },

      execution: {
        sdkInstalled: false,
        sdkCodeExecuted: false,
        runtimeTests: "NOT_RUN"
      }
    };

    await writeFile(
      join(stageDir, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n"
    );

    const report = [
      "# TheTowerSDK Preservation Report",
      "",
      "- SDK: " + CONFIG.packageName + "@" + CONFIG.sdkVersion,
      "- Script: 3.1.1",
      "- Commit: " + commit,
      "- Git tree SHA: " + treeSha,
      "- Git bundle: " + bundleName,
      "- Git bundle SHA-256: " + bundleSha256,
      "- Source archive: " + archiveName,
      "- Archive SHA-256: " + archiveSha256,
      "- Inventory entries: " + inventory.length,
      "- Verified blobs: " + exportResult.verifiedBlobCount,
      "- Preflight bytes: " + preflight.totalBytes,
      "- Archive files verified: " + archiveVerification.verifiedFiles,
      "- Archive bytes verified: " + archiveVerification.verifiedBytes,
      "- Inventory SHA-256: " + inventorySha256,
      "- License documents: " + licenseFiles.length,
      "- Submodule references: " + submodules.length,
      "- Files requiring license review: " + flagged.length,
      "- Files not individually reviewed: " + notReviewed.length,
      "",
      "## License documents",
      ...licenseFiles.map(path => "- " + path),
      "",
      "## Files requiring license review",
      ...flagged.map(item =>
        "- " + item.path + ": " +
        item.provenance.map(p => p.id).join(", ")
      ),
      "",
      "## Submodule references",
      ...submodules.map(item =>
        "- " + item.path + ": " + item.objectSha
      ),
      "",
      "## Limitations",
      "- Submodule contents are not included.",
      "- Non-UTF-8 Git paths are rejected.",
      "- Git bundle does not represent all upstream branches or tags.",
      "- Individual provenance review remains incomplete.",
      "- Public redistribution is not approved.",
      "- SDK runtime tests have not been performed."
    ].join("\n");

    await writeFile(
      join(stageDir, "preservation-report.md"),
      report + "\n"
    );

    console.log("[11/12] Publish with backup and rollback");

    try {
      await publishTransaction(stageDir, output, names);
    } catch (error) {
      preserveStage = error.preserveStage === true;
      throw error;
    }

    console.log("[12/12] Preservation completed");
    console.log("Git bundle SHA-256: " + bundleSha256);
    console.log("Archive SHA-256: " + archiveSha256);
    console.log("Inventory entries: " + inventory.length);
    console.log("Verified blobs: " + exportResult.verifiedBlobCount);
    console.log("Archive-to-inventory comparison: PASSED");
    console.log("Status: SNAPSHOT_CREATED");
    console.log("SDK runtime tests: NOT RUN");
    console.log("Public redistribution: NOT APPROVED");

  } finally {
    await rm(workDir, {
      recursive: true,
      force: true
    });

    if (!preserveStage) {
      await rm(stageDir, {
        recursive: true,
        force: true
      });
    } else {
      console.error(
        "Staging and backups retained for manual recovery: " +
        stageDir
      );
    }
  }
}


main().catch(error => {
  console.error("\nPRESERVATION FAILED");
  console.error(error);
  process.exitCode = 1;
});

#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation v3.1.0
 *
 * Requirements:
 * - Node.js >= 20
 * - Git
 * - GNU tar
 * - gzip
 *
 * Does not install or execute SDK code.
 */

import {
  mkdir,
  writeFile,
  readFile,
  rm,
  rename,
  stat,
  lstat,
  chmod,
  symlink,
  readlink,
  readdir,
  copyFile,
  mkdtemp
} from "node:fs/promises";

import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import {
  join,
  resolve,
  basename,
  dirname
} from "node:path";
import { spawn } from "node:child_process";


const CONFIG = {
  repository: "https://github.com/TmRxJD/TheTowerSDK.git",
  repositoryName: "TheTowerSDK",
  packageName: "thetowersdk",
  sdkVersion: "0.14.1",
  gameVersion: null,

  commit: "9a95672578fa064d71ddd54fad2ce5027a310b3a",

  maxBlobBytes: 128 * 1024 * 1024,

  outputDirectory: resolve(
    process.argv[2] ??
    "TheTowerData/staging/thetowersdk/0.14.1"
  )
};


const PROVENANCE_RULES = [
  {
    id: "EFFECTIVE_PATHS",
    patterns: [/effective-paths/i, /effective.paths/i],
    status: "CLARIFICATION_REQUIRED",
    reason:
      "Community spreadsheet-derived material; redistribution scope requires clarification."
  },
  {
    id: "ORPHIS",
    patterns: [
      /labs-categories\.generated/i,
      /lab-categories\.json/i
    ],
    status: "CLARIFICATION_REQUIRED",
    reason:
      "Orphis-related material; redistribution terms require clarification."
  },
  {
    id: "TOWER_IDLE_TOOLKIT",
    patterns: [
      /base-empirical-scaling/i,
      /scaling-regression-profile/i,
      /mechanics\/combat\/damage/i,
      /mechanics\/combat\/bonuses/i,
      /formatting\/duration/i
    ],
    status: "LICENSE_REVIEW",
    reason:
      "Potential tower-idle-toolkit-derived material; verify applicable attribution."
  }
];


function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options
    });

    const stdout = [];
    const stderr = [];

    child.stdout?.on("data", chunk => stdout.push(chunk));
    child.stderr?.on("data", chunk => stderr.push(chunk));

    let settled = false;

    child.on("error", error => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.on("close", code => {
      if (settled) return;
      settled = true;

      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr).toString("utf8");

      if (code !== 0) {
        reject(new Error(
          `${command} exited with code ${code}\n${err}`
        ));
      } else {
        resolvePromise({
          stdout: out,
          stderr: err
        });
      }
    });
  });
}


async function sha256File(path) {
  const hash = createHash("sha256");

  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}


function gitBlobSha1(data) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${data.length}\0`))
    .update(data)
    .digest("hex");
}


function decodeGitPath(buffer) {
  const value = new TextDecoder("utf-8", {
    fatal: true
  }).decode(buffer);

  if (!Buffer.from(value, "utf8").equals(buffer)) {
    throw new Error(
      "Git path cannot be represented losslessly as UTF-8."
    );
  }

  if (
    value.startsWith("/") ||
    value.includes("\\") ||
    value.split("/").some(part =>
      !part || part === "." || part === ".."
    )
  ) {
    throw new Error(`Unsafe Git path: ${value}`);
  }

  return value;
}


function parseTree(raw) {
  const records = [];
  let start = 0;

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== 0) continue;

    const record = raw.subarray(start, i);
    start = i + 1;

    if (!record.length) continue;

    const tab = record.indexOf(9);

    if (tab < 0) {
      throw new Error("Invalid Git tree record.");
    }

    const [mode, type, objectSha] =
      record.subarray(0, tab)
        .toString("ascii")
        .split(" ");

    const path = decodeGitPath(
      record.subarray(tab + 1)
    );

    if (!mode || !type || !objectSha) {
      throw new Error(`Invalid metadata: ${path}`);
    }

    if (
      type !== "blob" &&
      !(mode === "160000" && type === "commit")
    ) {
      throw new Error(
        `Unsupported Git tree entry: ${path}`
      );
    }

    const provenance = PROVENANCE_RULES
      .filter(rule =>
        rule.patterns.some(pattern =>
          pattern.test(path)
        )
      )
      .map(rule => ({
        id: rule.id,
        status: rule.status,
        reason: rule.reason
      }));

    if (
      /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(path)
    ) {
      provenance.push({
        id: "LICENSE_DOCUMENT",
        status: "PRESERVE",
        reason: "License or attribution document."
      });
    }

    if (!provenance.length) {
      provenance.push({
        id: "UNASSESSED",
        status: "NOT_REVIEWED",
        reason:
          "File-level provenance has not been individually established."
      });
    }

    records.push({
      path,
      mode,
      type,
      objectSha,
      provenance,
      isSubmodule: mode === "160000"
    });
  }

  if (start !== raw.length) {
    throw new Error(
      "Incomplete NUL-terminated Git tree."
    );
  }

  return records;
}


async function writeJson(path, value) {
  await writeFile(
    path,
    JSON.stringify(value, null, 2) + "\n"
  );
}


async function exportGitTree(
  repoDir,
  snapshotDir,
  inventory
) {
  let verifiedBlobCount = 0;
  let exportedBytes = 0;

  await mkdir(snapshotDir, {
    recursive: true
  });

  for (const item of inventory) {
    if (item.isSubmodule) continue;

    const blob = await run("git", [
      "-C",
      repoDir,
      "cat-file",
      "blob",
      item.objectSha
    ]);

    const data = blob.stdout;

    if (data.length > CONFIG.maxBlobBytes) {
      throw new Error(
        `Blob exceeds memory safety limit ` +
        `(${CONFIG.maxBlobBytes} bytes): ${item.path}`
      );
    }

    if (gitBlobSha1(data) !== item.objectSha) {
      throw new Error(
        `Git blob SHA-1 mismatch: ${item.path}`
      );
    }

    const destination = join(snapshotDir, item.path);

    await mkdir(dirname(destination), {
      recursive: true
    });

    if (item.mode === "120000") {
      const target = new TextDecoder("utf-8", {
        fatal: true
      }).decode(data);

      if (target.includes("\0")) {
        throw new Error(
          `Invalid symlink target: ${item.path}`
        );
      }

      await symlink(target, destination);

    } else if (
      item.mode === "100644" ||
      item.mode === "100755"
    ) {
      await writeFile(destination, data, {
        flag: "wx"
      });

      await chmod(
        destination,
        item.mode === "100755" ? 0o755 : 0o644
      );

    } else {
      throw new Error(
        `Unsupported file mode ${item.mode}: ${item.path}`
      );
    }

    verifiedBlobCount++;
    exportedBytes += data.length;
  }

  return {
    verifiedBlobCount,
    exportedBytes
  };
}


async function verifyExtractedTree(
  root,
  inventory
) {
  const expected = new Map();

  for (const item of inventory) {
    if (item.isSubmodule) continue;
    expected.set(item.path, item);
  }

  const actualFiles = new Set();
  const actualDirs = new Set();

  async function walk(directory, prefix = "") {
    const entries = await readdir(directory, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const rel = prefix
        ? `${prefix}/${entry.name}`
        : entry.name;

      const full = join(directory, entry.name);
      const info = await lstat(full);

      if (info.isDirectory()) {
        actualDirs.add(rel);
        await walk(full, rel);
      } else {
        actualFiles.add(rel);
      }
    }
  }

  await walk(root);

  const requiredDirs = new Set();

  for (const path of expected.keys()) {
    const parts = path.split("/");

    for (let i = 1; i < parts.length; i++) {
      requiredDirs.add(
        parts.slice(0, i).join("/")
      );
    }
  }

  for (const path of expected.keys()) {
    if (!actualFiles.has(path)) {
      throw new Error(
        `Archive missing file: ${path}`
      );
    }
  }

  for (const path of actualFiles) {
    if (!expected.has(path)) {
      throw new Error(
        `Unexpected archive file: ${path}`
      );
    }
  }

  for (const path of requiredDirs) {
    if (!actualDirs.has(path)) {
      throw new Error(
        `Archive missing directory: ${path}`
      );
    }
  }

  for (const path of actualDirs) {
    if (!requiredDirs.has(path)) {
      throw new Error(
        `Unexpected archive directory: ${path}`
      );
    }
  }

  for (const [path, item] of expected) {
    const full = join(root, path);
    const info = await lstat(full);

    if (item.mode === "120000") {
      if (!info.isSymbolicLink()) {
        throw new Error(
          `Expected symlink: ${path}`
        );
      }

      const target = Buffer.from(
        await readlink(full),
        "utf8"
      );

      if (gitBlobSha1(target) !== item.objectSha) {
        throw new Error(
          `Archive symlink content mismatch: ${path}`
        );
      }

    } else {
      if (!info.isFile()) {
        throw new Error(
          `Expected regular file: ${path}`
        );
      }

      const data = await readFile(full);

      if (gitBlobSha1(data) !== item.objectSha) {
        throw new Error(
          `Archive content mismatch: ${path}`
        );
      }

      const executable =
        (info.mode & 0o111) !== 0;

      if (
        executable !== (item.mode === "100755")
      ) {
        throw new Error(
          `Archive permission mismatch: ${path}`
        );
      }
    }
  }

  return {
    verifiedFiles: expected.size
  };
}


async function publishTransaction(
  stageDir,
  outputDir,
  names
) {
  const backupDir = join(stageDir, "backup");

  await mkdir(backupDir, {
    recursive: true
  });

  const existed = new Set();

  for (const name of names) {
    try {
      await stat(join(outputDir, name));

      await copyFile(
        join(outputDir, name),
        join(backupDir, name)
      );

      existed.add(name);

    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const published = [];

  try {
    for (const name of names) {
      await rename(
        join(stageDir, name),
        join(outputDir, name)
      );

      published.push(name);
    }

  } catch (error) {
    for (const name of published.reverse()) {
      const target = join(outputDir, name);

      if (existed.has(name)) {
        const restoreTemp = join(
          stageDir,
          `restore-${name}`
        );

        await copyFile(
          join(backupDir, name),
          restoreTemp
        );

        await rename(restoreTemp, target);

      } else {
        await rm(target, {
          force: true
        });
      }
    }

    throw new Error(
      `Publish failed; previous outputs restored: ${error.message}`
    );
  }
}


async function main() {
  if (
    Number(process.versions.node.split(".")[0]) < 20
  ) {
    throw new Error(
      "Node.js 20 or newer is required."
    );
  }

  const startedAt = new Date().toISOString();
  const output = CONFIG.outputDirectory;

  await mkdir(output, {
    recursive: true
  });

  const workDir = await mkdtemp(
    join(tmpdir(), "samantha-preserve-v3-")
  );

  const stageDir = await mkdtemp(
    join(output, ".preserve-stage-")
  );

  const repoDir = join(workDir, "repo");
  const snapshotParent = join(workDir, "snapshot");

  const snapshotDir = join(
    snapshotParent,
    `${CONFIG.repositoryName}-${CONFIG.sdkVersion}`
  );

  const verifyParent = join(workDir, "verify");

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
    "manifest.json",
    "preservation-report.md"
  ];

  try {
    console.log(
      "Samantha TheTowerSDK Preservation v3.1.0"
    );

    console.log(
      `SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`
    );

    console.log(`Commit: ${CONFIG.commit}`);

    console.log("[1/11] Initialize temporary repository");

    await run("git", [
      "init",
      repoDir
    ]);

    await run("git", [
      "-C",
      repoDir,
      "remote",
      "add",
      "origin",
      CONFIG.repository
    ]);

    console.log("[2/11] Fetch exact upstream commit");

    await run("git", [
      "-C",
      repoDir,
      "fetch",
      "origin",
      CONFIG.commit
    ]);

    const commit = (
      await run("git", [
        "-C",
        repoDir,
        "rev-parse",
        "FETCH_HEAD^{commit}"
      ])
    ).stdout.toString("utf8").trim();

    if (commit !== CONFIG.commit) {
      throw new Error(
        "Fetched commit SHA mismatch."
      );
    }

    const treeSha = (
      await run("git", [
        "-C",
        repoDir,
        "rev-parse",
        `${commit}^{tree}`
      ])
    ).stdout.toString("utf8").trim();

    console.log("[3/11] Verify package metadata");

    const packageJson = JSON.parse(
      (
        await run("git", [
          "-C",
          repoDir,
          "show",
          `${commit}:package.json`
        ])
      ).stdout.toString("utf8")
    );

    if (
      packageJson.name !== CONFIG.packageName ||
      packageJson.version !== CONFIG.sdkVersion
    ) {
      throw new Error(
        "SDK package name/version mismatch."
      );
    }

    console.log("[4/11] Build recursive inventory");

    const rawTree = await run("git", [
      "-C",
      repoDir,
      "ls-tree",
      "-r",
      "-z",
      "--full-tree",
      commit
    ]);

    const inventory = parseTree(rawTree.stdout);

    if (!inventory.length) {
      throw new Error("Inventory is empty.");
    }

    const submodules = inventory.filter(
      item => item.isSubmodule
    );

    console.log("[5/11] Create and verify Git bundle");

    const ref = "refs/heads/samantha-preserved-sdk";

    await run("git", [
      "-C",
      repoDir,
      "update-ref",
      ref,
      commit
    ]);

    const stagedBundle = join(
      stageDir,
      bundleName
    );

    await run("git", [
      "-C",
      repoDir,
      "bundle",
      "create",
      stagedBundle,
      ref
    ]);

    await run("git", [
      "-C",
      repoDir,
      "bundle",
      "verify",
      stagedBundle
    ]);

    const bundleSha256 =
      await sha256File(stagedBundle);

    const bundleBytes = (
      await stat(stagedBundle)
    ).size;

    if (!bundleBytes) {
      throw new Error("Git bundle is empty.");
    }

    console.log("[6/11] Export and verify Git blobs");

    const exportResult = await exportGitTree(
      repoDir,
      snapshotDir,
      inventory
    );

    const expectedBlobCount = inventory.filter(
      item => item.type === "blob"
    ).length;

    if (
      exportResult.verifiedBlobCount !== expectedBlobCount
    ) {
      throw new Error(
        "Exported blob count differs from inventory."
      );
    }

    console.log("[7/11] Create source archive");

    await mkdir(snapshotParent, {
      recursive: true
    });

    const stagedArchive = join(
      stageDir,
      archiveName
    );

    await run("tar", [
      "--sort=name",
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "-czf",
      stagedArchive,
      "-C",
      snapshotParent,
      basename(snapshotDir)
    ]);

    await run("gzip", [
      "-t",
      stagedArchive
    ]);

    await run("tar", [
      "-tzf",
      stagedArchive
    ]);

    console.log(
      "[8/11] Extract archive and compare every file"
    );

    await mkdir(verifyParent, {
      recursive: true
    });

    await run("tar", [
      "-xzf",
      stagedArchive,
      "-C",
      verifyParent
    ]);

    const archiveVerification =
      await verifyExtractedTree(
        verifyDir,
        inventory
      );

    const archiveSha256 =
      await sha256File(stagedArchive);

    const archiveBytes = (
      await stat(stagedArchive)
    ).size;

    if (!archiveBytes) {
      throw new Error(
        "Source archive is empty."
      );
    }

    console.log("[9/11] Build manifest and report");

    const inventorySha256 = createHash("sha256")
      .update(JSON.stringify(inventory))
      .digest("hex");

    const licenseFiles = inventory
      .filter(item =>
        /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(item.path)
      )
      .map(item => item.path);

    const flagged = inventory.filter(item =>
      item.provenance.some(p =>
        p.status === "CLARIFICATION_REQUIRED" ||
        p.status === "LICENSE_REVIEW"
      )
    );

    const notReviewed = inventory.filter(item =>
      item.provenance.some(p =>
        p.status === "NOT_REVIEWED"
      )
    );

    const manifest = {
      schemaVersion: "1.0.0",

      preservation: {
        status: "SNAPSHOT_CREATED",
        scriptVersion: "3.1.0",
        startedAt,
        completedAt: new Date().toISOString()
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
        nodeRequirement:
          packageJson.engines?.node ?? null
      },

      gitBundle: {
        file: bundleName,
        sizeBytes: bundleBytes,
        sha256: bundleSha256,
        verification: "PASSED",
        scope:
          "Commit and history reachable from fetched commit; not all upstream branches or tags."
      },

      archive: {
        file: archiveName,
        format: "tar.gz",
        sizeBytes: archiveBytes,
        sha256: archiveSha256,
        gzipTest: "PASSED",
        extractionTest: "PASSED",
        verifiedFiles:
          archiveVerification.verifiedFiles,
        comparison:
          "Every archived file and symlink compared against its Git blob SHA-1."
      },

      inventory: {
        totalEntries: inventory.length,
        blobCount: expectedBlobCount,
        verifiedBlobCount:
          exportResult.verifiedBlobCount,
        exportedBytes: exportResult.exportedBytes,
        inventorySha256,
        licenseDocuments: licenseFiles,
        submoduleReferenceCount: submodules.length,
        flaggedFileCount: flagged.length,
        notReviewedFileCount: notReviewed.length,
        entries: inventory
      },

      licensing: {
        overallStatus: "REVIEW_REQUIRED",
        publicRedistributionApproved: false,
        notes: [
          "Submodule contents are not included; only gitlink references are recorded.",
          "File-level provenance classification is preliminary.",
          "NOT_REVIEWED does not mean license-free.",
          "Public redistribution is not approved."
        ]
      },

      execution: {
        sdkInstalled: false,
        sdkCodeExecuted: false,
        runtimeTests: "NOT_RUN"
      }
    };

    await writeJson(
      join(stageDir, "manifest.json"),
      manifest
    );

    const report = [
      "# TheTowerSDK Preservation Report",
      "",
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
      "",
      "## License documents",
      ...licenseFiles.map(path => `- ${path}`),
      "",
      "## Files requiring license review",
      ...flagged.map(item =>
        `- ${item.path}: ${item.provenance.map(p => p.id).join(", ")}`
      ),
      "",
      "## Submodule references",
      ...submodules.map(item =>
        `- ${item.path}: ${item.objectSha}`
      ),
      "",
      "## Limitations",
      "- Submodule contents are not included.",
      "- Non-UTF-8 Git paths are rejected rather than silently altered.",
      "- Git bundle does not represent all upstream branches or tags.",
      "- Individual provenance review remains incomplete.",
      "- Public redistribution is not approved.",
      "- SDK runtime tests have not been performed."
    ].join("\n");

    await writeFile(
      join(stageDir, "preservation-report.md"),
      report + "\n"
    );

    console.log(
      "[10/11] Publish outputs with rollback protection"
    );

    await publishTransaction(
      stageDir,
      output,
      names
    );

    console.log("[11/11] Preservation completed");

    console.log(
      `Git bundle SHA-256: ${bundleSha256}`
    );

    console.log(
      `Archive SHA-256: ${archiveSha256}`
    );

    console.log(
      `Inventory entries: ${inventory.length}`
    );

    console.log(
      `Verified blobs: ${exportResult.verifiedBlobCount}`
    );

    console.log(
      "Archive-to-inventory comparison: PASSED"
    );

    console.log("Status: SNAPSHOT_CREATED");
    console.log("SDK runtime tests: NOT RUN");
    console.log("Public redistribution: NOT APPROVED");

  } finally {
    await rm(workDir, {
      recursive: true,
      force: true
    });

    await rm(stageDir, {
      recursive: true,
      force: true
    });
  }
}


main().catch(error => {
  console.error("\nPRESERVATION FAILED");
  console.error(error);
  process.exitCode = 1;
});
