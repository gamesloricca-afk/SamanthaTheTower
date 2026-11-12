
#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation v3
 *
 * Requirements:
 *   Node.js >= 20
 *   Git
 *   GNU tar
 *
 * Usage:
 *   node TheTowerData/scripts/preserve-upstream-v3.mjs
 *
 * Optional output directory:
 *   node TheTowerData/scripts/preserve-upstream-v3.mjs ./output
 *
 * This script:
 *   - Fetches one exact upstream commit.
 *   - Verifies package identity and commit SHA.
 *   - Inventories every tracked tree entry recursively.
 *   - Exports tracked files through Git index.
 *   - Preserves symlinks and executable permissions.
 *   - Records submodule references without claiming their contents.
 *   - Creates and verifies a compressed archive.
 *   - Generates SHA-256 and provenance reports.
 *
 * It does NOT install or execute SDK code.
 */

import {
  mkdir,
  writeFile,
  mkdtemp,
  rm,
  rename,
  stat
} from "node:fs/promises";

import {
  createReadStream,
  createWriteStream
} from "node:fs";

import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve, basename, dirname } from "node:path";
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";


const CONFIG = {
  repository: "https://github.com/TmRxJD/TheTowerSDK.git",
  repositoryName: "TheTowerSDK",
  packageName: "thetowersdk",
  sdkVersion: "0.14.1",
  gameVersion: null,
  commit: "9a95672578fa064d71ddd54fad2ce5027a310b3a",

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
    reason: "Orphis-related extraction/localization material; redistribution terms require clarification."
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
    reason: "Potential tower-idle-toolkit-derived material; verify applicable ISC attribution."
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

      const output = Buffer.concat(stdout);
      const errors = Buffer.concat(stderr).toString("utf8");

      if (code !== 0) {
        reject(new Error(
          `${command} exited with code ${code}\n${errors}`
        ));
        return;
      }

      resolvePromise({
        stdout: output,
        stderr: errors
      });
    });
  });
}


function waitForProcess(child) {
  return new Promise((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("close", code => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolvePromise();
      }
    });
  });
}


async function sha256File(path) {
  const hash = createHash("sha256");

  await pipeline(
    createReadStream(path),
    async function* (source) {
      for await (const chunk of source) {
        hash.update(chunk);
      }
    }
  );

  return hash.digest("hex");
}


function classifyFile(path) {
  const matches = PROVENANCE_RULES
    .filter(rule =>
      rule.patterns.some(pattern => pattern.test(path))
    )
    .map(rule => ({
      id: rule.id,
      status: rule.status,
      reason: rule.reason
    }));

  if (/(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(path)) {
    matches.push({
      id: "LICENSE_DOCUMENT",
      status: "PRESERVE",
      reason: "License or attribution document."
    });
  }

  if (matches.length === 0) {
    matches.push({
      id: "UNASSESSED",
      status: "NOT_REVIEWED",
      reason: "File-level provenance has not been individually established."
    });
  }

  return matches;
}


function parseTree(raw) {
  const records = raw.toString("utf8").split("\0").filter(Boolean);

  return records.map(record => {
    const tab = record.indexOf("\t");

    if (tab < 0) {
      throw new Error("Invalid git ls-tree record.");
    }

    const [mode, type, objectSha] =
      record.slice(0, tab).split(" ");

    const path = record.slice(tab + 1);

    return {
      path,
      mode,
      type,
      objectSha,
      provenance: classifyFile(path),
      isSubmodule: mode === "160000" && type === "commit"
    };
  });
}


async function writeJsonAtomic(path, value) {
  const temporaryPath = `${path}.partial`;

  await writeFile(
    temporaryPath,
    JSON.stringify(value, null, 2) + "\n"
  );

  await rename(temporaryPath, path);
}


async function main() {
  if (Number(process.versions.node.split(".")[0]) < 20) {
    throw new Error("Node.js 20 or newer is required.");
  }

  const startedAt = new Date().toISOString();

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "samantha-sdk-v3-")
  );

  const repositoryDirectory = join(
    temporaryDirectory,
    "repository"
  );

  const snapshotDirectory = join(
    temporaryDirectory,
    "snapshot",
    `${CONFIG.repositoryName}-${CONFIG.sdkVersion}`
  );

  const archiveName =
    `thetowersdk-${CONFIG.sdkVersion}-` +
    `${CONFIG.commit.slice(0, 12)}.tar.gz`;

  const archivePath = join(
    CONFIG.outputDirectory,
    archiveName
  );

  const partialArchivePath = `${archivePath}.partial`;

  let completed = false;

  try {
    console.log("Samantha TheTowerSDK Preservation v3");
    console.log(`SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`);
    console.log(`Commit: ${CONFIG.commit}`);

    await mkdir(CONFIG.outputDirectory, { recursive: true });
    await mkdir(dirname(snapshotDirectory), { recursive: true });

    // STEP 1: Initialize temporary repository.

    console.log("\n[1/9] Initializing repository...");

    await run("git", ["init", repositoryDirectory]);

    await run("git", [
      "-C", repositoryDirectory,
      "remote", "add", "origin", CONFIG.repository
    ]);

    // STEP 2: Fetch exact commit.

    console.log("[2/9] Fetching exact upstream commit...");

    await run("git", [
      "-C", repositoryDirectory,
      "fetch",
      "--depth=1",
      "origin",
      CONFIG.commit
    ]);

    const commitResult = await run("git", [
      "-C", repositoryDirectory,
      "rev-parse",
      "FETCH_HEAD^{commit}"
    ]);

    const actualCommit = commitResult.stdout.toString("utf8").trim();

    if (actualCommit !== CONFIG.commit) {
      throw new Error(
        `Commit mismatch. Expected ${CONFIG.commit}, received ${actualCommit}`
      );
    }

    const treeResultSha = await run("git", [
      "-C", repositoryDirectory,
      "rev-parse",
      `${actualCommit}^{tree}`
    ]);

    const treeSha = treeResultSha.stdout.toString("utf8").trim();

    // STEP 3: Verify package metadata.

    console.log("[3/9] Verifying package metadata...");

    const packageResult = await run("git", [
      "-C", repositoryDirectory,
      "show",
      `${actualCommit}:package.json`
    ]);

    const packageMetadata = JSON.parse(
      packageResult.stdout.toString("utf8")
    );

    if (
      packageMetadata.name !== CONFIG.packageName ||
      packageMetadata.version !== CONFIG.sdkVersion
    ) {
      throw new Error("Package name or version does not match configuration.");
    }

    // STEP 4: Build complete recursive inventory.

    console.log("[4/9] Building recursive inventory...");

    const rawTree = await run("git", [
      "-C", repositoryDirectory,
      "ls-tree",
      "-r",
      "-z",
      "--full-tree",
      actualCommit
    ]);

    const inventory = parseTree(rawTree.stdout);

    if (inventory.length === 0) {
      throw new Error("Inventory is empty. Preservation aborted.");
    }

    const submodules = inventory.filter(item => item.isSubmodule);

    console.log(`Inventory entries: ${inventory.length}`);
    console.log(`Submodule references: ${submodules.length}`);

    // STEP 5: Export tracked files from the Git index.
    // This avoids git archive's export-ignore filtering.

    console.log("[5/9] Exporting tracked files...");

    await run("git", [
      "-C", repositoryDirectory,
      "read-tree",
      actualCommit
    ]);

    await mkdir(snapshotDirectory, { recursive: true });

    await run("git", [
      "-C", repositoryDirectory,
      "checkout-index",
      "--all",
      `--prefix=${snapshotDirectory}/`
    ]);

    // STEP 6: Create compressed archive.

    console.log("[6/9] Creating source archive...");

    const tar = spawn("tar", [
      "--sort=name",
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "-cf",
      "-",
      "-C",
      dirname(snapshotDirectory),
      basename(snapshotDirectory)
    ], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let tarError = "";

    tar.stderr.on("data", chunk => {
      tarError += chunk.toString();
    });

    const tarExit = waitForProcess(tar);

    try {
      await pipeline(
        tar.stdout,
        createGzip({ level: 9 }),
        createWriteStream(partialArchivePath)
      );

      await tarExit;
    } catch (error) {
      tar.kill();
      await tarExit.catch(() => {});
      throw new Error(
        `Archive creation failed: ${error.message}\n${tarError}`
      );
    }

    // STEP 7: Validate archive and checksum.

    console.log("[7/9] Validating archive...");

    await run("gzip", ["-t", partialArchivePath]);

    await run("tar", ["-tzf", partialArchivePath]);

    const archiveInfo = await stat(partialArchivePath);

    if (archiveInfo.size === 0) {
      throw new Error("Archive is empty.");
    }

    const archiveSha256 = await sha256File(partialArchivePath);

    // Replace prior archive only after the new archive is valid.
    await rename(partialArchivePath, archivePath);

    // STEP 8: Build manifest and report.

    console.log("[8/9] Creating manifest and report...");

    const inventoryJson = JSON.stringify(inventory);

    const inventorySha256 = createHash("sha256")
      .update(inventoryJson)
      .digest("hex");

    const licenseFiles = inventory
      .filter(item =>
        /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(item.path)
      )
      .map(item => item.path);

    const flaggedFiles = inventory.filter(item =>
      item.provenance.some(p =>
        p.status === "CLARIFICATION_REQUIRED" ||
        p.status === "LICENSE_REVIEW"
      )
    );

    const notReviewedFiles = inventory.filter(item =>
      item.provenance.some(p => p.status === "NOT_REVIEWED")
    );

    const manifest = {
      schemaVersion: "1.0.0",

      preservation: {
        status: "SNAPSHOT_CREATED",
        scriptVersion: "3.0.0",
        startedAt,
        completedAt: new Date().toISOString()
      },

      source: {
        repository: CONFIG.repository,
        repositoryName: CONFIG.repositoryName,
        packageName: packageMetadata.name,
        sdkVersion: packageMetadata.version,
        gameVersion: CONFIG.gameVersion,
        commit: actualCommit,
        gitTreeSha: treeSha,
        packageLicense: packageMetadata.license ?? null,
        nodeRequirement: packageMetadata.engines?.node ?? null
      },

      archive: {
        file: archiveName,
        format: "tar.gz",
        sizeBytes: archiveInfo.size,
        sha256: archiveSha256,
        gzipTest: "PASSED",
        tarListingTest: "PASSED"
      },

      inventory: {
        totalEntries: inventory.length,
        inventorySha256,
        licenseDocuments: licenseFiles,
        submoduleReferenceCount: submodules.length,
        flaggedFileCount: flaggedFiles.length,
        notReviewedFileCount: notReviewedFiles.length,
        entries: inventory
      },

      licensing: {
        overallStatus: "REVIEW_REQUIRED",
        publicRedistributionApproved: false,
        notes: [
          "Inventory covers recursively tracked Git tree entries.",
          "Snapshot exports tracked files through Git index.",
          "Submodule contents are not included; only gitlink references are recorded.",
          "File provenance classification is preliminary.",
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

    await writeJsonAtomic(
      join(CONFIG.outputDirectory, "manifest.json"),
      manifest
    );

    const report = [
      "# TheTowerSDK Preservation Report",
      "",
      `- SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`,
      `- Commit: ${actualCommit}`,
      `- Git tree SHA: ${treeSha}`,
      `- Created: ${startedAt}`,
      `- Archive: ${archiveName}`,
      `- Archive size: ${archiveInfo.size} bytes`,
      `- Archive SHA-256: ${archiveSha256}`,
      `- Inventory entries: ${inventory.length}`,
      `- Inventory SHA-256: ${inventorySha256}`,
      `- License documents: ${licenseFiles.length}`,
      `- Submodule references: ${submodules.length}`,
      `- Files requiring license review: ${flaggedFiles.length}`,
      `- Files not individually reviewed: ${notReviewedFiles.length}`,
      "",
      "## License documents",
      ...licenseFiles.map(path => `- ${path}`),
      "",
      "## Files requiring license review",
      ...flaggedFiles.map(item =>
        `- ${item.path}: ${item.provenance
          .map(p => `${p.id} (${p.status})`)
          .join(", ")}`
      ),
      "",
      "## Submodule references",
      ...submodules.map(item =>
        `- ${item.path}: ${item.objectSha}`
      ),
      "",
      "## Limitations",
      "- Submodule contents are not included.",
      "- Empty Git directories are not represented in the Git tree.",
      "- Provenance classification is preliminary.",
      "- Public redistribution is not approved.",
      "- SDK installation and runtime tests have not been performed."
    ].join("\n");

    await writeFile(
      join(CONFIG.outputDirectory, "preservation-report.md"),
      report + "\n"
    );

    // STEP 9: Summary.

    console.log("[9/9] Preservation completed.");

    console.log(`Archive: ${archivePath}`);
    console.log(`Archive SHA-256: ${archiveSha256}`);
    console.log(`Inventory entries: ${inventory.length}`);
    console.log(`Inventory SHA-256: ${inventorySha256}`);

    console.log("Status: SNAPSHOT_CREATED");
    console.log("Archive validation: PASSED");
    console.log("SDK runtime tests: NOT RUN");
    console.log("Public redistribution: NOT APPROVED");

    completed = true;

  } finally {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true
    });

    if (!completed) {
      await rm(partialArchivePath, { force: true });
    }
  }
}


main().catch(error => {
  console.error("\nPRESERVATION FAILED");
  console.error(error);
  process.exitCode = 1;
});
