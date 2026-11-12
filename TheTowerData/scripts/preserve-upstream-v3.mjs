
#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation v3
 * Revised preservation implementation.
 *
 * Requirements:
 *   Node.js >= 20
 *   Git
 *   GNU tar
 *   gzip
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
  chmod,
  symlink
} from "node:fs/promises";

import {
  createReadStream
} from "node:fs";

import {
  createHash
} from "node:crypto";

import {
  tmpdir
} from "node:os";

import {
  join,
  resolve,
  basename,
  dirname
} from "node:path";

import {
  spawn
} from "node:child_process";


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
        return;
      }

      resolvePromise({
        stdout: out,
        stderr: err
      });
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
  const header = Buffer.from(`blob ${data.length}\0`);

  return createHash("sha1")
    .update(header)
    .update(data)
    .digest("hex");
}


function decodeGitPath(buffer) {
  const decoder = new TextDecoder("utf-8", {
    fatal: true
  });

  const value = decoder.decode(buffer);

  if (!Buffer.from(value, "utf8").equals(buffer)) {
    throw new Error("Git path cannot be represented losslessly as UTF-8.");
  }

  if (
    value.startsWith("/") ||
    value.split("/").some(part =>
      part === "" || part === "." || part === ".."
    )
  ) {
    throw new Error(`Unsafe Git path detected: ${value}`);
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

    if (record.length === 0) continue;

    const tab = record.indexOf(9);

    if (tab < 0) {
      throw new Error("Invalid Git tree record.");
    }

    const metadata = record.subarray(0, tab).toString("ascii");
    const path = decodeGitPath(record.subarray(tab + 1));

    const [mode, type, objectSha] = metadata.split(" ");

    if (!mode || !type || !objectSha) {
      throw new Error(`Invalid Git metadata: ${path}`);
    }

    if (type !== "blob" && !(mode === "160000" && type === "commit")) {
      throw new Error(`Unsupported Git tree entry: ${path}`);
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

    if (/(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(path)) {
      provenance.push({
        id: "LICENSE_DOCUMENT",
        status: "PRESERVE",
        reason: "License or attribution document."
      });
    }

    if (provenance.length === 0) {
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
      provenance,
      isSubmodule: mode === "160000"
    });
  }

  if (start !== raw.length) {
    throw new Error("Incomplete NUL-terminated Git tree output.");
  }

  return records;
}


async function writeJsonAtomic(path, value) {
  const temporaryPath = `${path}.partial`;

  await writeFile(
    temporaryPath,
    JSON.stringify(value, null, 2) + "\n"
  );

  await rename(temporaryPath, path);
}


async function exportGitTree(repositoryDirectory, snapshotDirectory, inventory) {
  await mkdir(snapshotDirectory, { recursive: true });

  let verifiedBlobCount = 0;
  let exportedBytes = 0;

  for (const item of inventory) {
    const destination = join(snapshotDirectory, item.path);

    if (item.isSubmodule) {
      // A gitlink is a reference, not a file.
      // Its contents are deliberately not fabricated.
      continue;
    }

    const blobResult = await run("git", [
      "-C",
      repositoryDirectory,
      "cat-file",
      "blob",
      item.objectSha
    ]);

    const data = blobResult.stdout;
    const actualBlobSha = gitBlobSha1(data);

    if (actualBlobSha !== item.objectSha) {
      throw new Error(`Git blob checksum mismatch: ${item.path}`);
    }

    await mkdir(dirname(destination), {
      recursive: true
    });

    if (item.mode === "120000") {
      const target = new TextDecoder("utf-8", {
        fatal: true
      }).decode(data);

      await symlink(target, destination);

    } else if (
      item.mode === "100644" ||
      item.mode === "100755"
    ) {
      await writeFile(destination, data);

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


async function main() {
  if (Number(process.versions.node.split(".")[0]) < 20) {
    throw new Error("Node.js 20 or newer is required.");
  }

  const startedAt = new Date().toISOString();

  const temp = await import("node:fs/promises");
  const temporaryDirectory = await temp.mkdtemp(
    join(tmpdir(), "samantha-preservation-v3-")
  );

  const repositoryDirectory = join(
    temporaryDirectory,
    "repository"
  );

  const snapshotParent = join(
    temporaryDirectory,
    "snapshot"
  );

  const snapshotDirectory = join(
    snapshotParent,
    `${CONFIG.repositoryName}-${CONFIG.sdkVersion}`
  );

  const archiveName =
    `thetowersdk-${CONFIG.sdkVersion}-` +
    `${CONFIG.commit.slice(0, 12)}.tar.gz`;

  const bundleName =
    `thetowersdk-${CONFIG.sdkVersion}-` +
    `${CONFIG.commit.slice(0, 12)}.bundle`;

  const output = CONFIG.outputDirectory;

  const archivePath = join(output, archiveName);
  const bundlePath = join(output, bundleName);

  const archivePartial = `${archivePath}.partial`;
  const bundlePartial = `${bundlePath}.partial`;

  const manifestPath = join(output, "manifest.json");
  const reportPath = join(output, "preservation-report.md");

  const temporaryFiles = [
    archivePartial,
    bundlePartial,
    `${manifestPath}.partial`,
    `${reportPath}.partial`
  ];

  const publishedFiles = [];

  let completed = false;

  try {
    await mkdir(output, { recursive: true });

    console.log("Samantha TheTowerSDK Preservation v3");
    console.log(`SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`);
    console.log(`Commit: ${CONFIG.commit}`);

    // STEP 1: Initialize repository.

    console.log("\n[1/10] Initializing temporary repository...");

    await run("git", ["init", repositoryDirectory]);

    await run("git", [
      "-C", repositoryDirectory,
      "remote", "add", "origin", CONFIG.repository
    ]);

    // STEP 2: Fetch exact commit with history.

    console.log("[2/10] Fetching exact commit and reachable history...");

    await run("git", [
      "-C", repositoryDirectory,
      "fetch",
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
      throw new Error("Fetched commit does not match configured commit.");
    }

    const treeResult = await run("git", [
      "-C", repositoryDirectory,
      "rev-parse",
      `${actualCommit}^{tree}`
    ]);

    const treeSha = treeResult.stdout.toString("utf8").trim();

    // STEP 3: Verify package metadata.

    console.log("[3/10] Verifying package metadata...");

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
      throw new Error("SDK package identity mismatch.");
    }

    // STEP 4: Recursive inventory.

    console.log("[4/10] Building complete recursive inventory...");

    const tree = await run("git", [
      "-C", repositoryDirectory,
      "ls-tree",
      "-r",
      "-z",
      "--full-tree",
      actualCommit
    ]);

    const inventory = parseTree(tree.stdout);

    if (inventory.length === 0) {
      throw new Error("Inventory is empty.");
    }

    const submodules = inventory.filter(item => item.isSubmodule);

    // STEP 5: Preserve Git bundle.

    console.log("[5/10] Creating Git bundle...");

    const preservationRef = "refs/heads/samantha-preserved-sdk";

    await run("git", [
      "-C", repositoryDirectory,
      "update-ref",
      preservationRef,
      actualCommit
    ]);

    await run("git", [
      "-C", repositoryDirectory,
      "bundle",
      "create",
      bundlePartial,
      preservationRef
    ]);

    await run("git", [
      "-C", repositoryDirectory,
      "bundle",
      "verify",
      bundlePartial
    ]);

    const bundleSha256 = await sha256File(bundlePartial);
    const bundleInfo = await stat(bundlePartial);

    if (bundleInfo.size === 0) {
      throw new Error("Git bundle is empty.");
    }

    // STEP 6: Export and verify every tracked blob.

    console.log("[6/10] Exporting and verifying Git blobs...");

    const exportResult = await exportGitTree(
      repositoryDirectory,
      snapshotDirectory,
      inventory
    );

    const expectedBlobCount = inventory.filter(
      item => item.type === "blob"
    ).length;

    if (exportResult.verifiedBlobCount !== expectedBlobCount) {
      throw new Error("Exported blob count does not match inventory.");
    }

    // STEP 7: Create deterministic source archive.

    console.log("[7/10] Creating source archive...");

    await run("tar", [
      "--sort=name",
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "-czf",
      archivePartial,
      "-C",
      snapshotParent,
      basename(snapshotDirectory)
    ]);

    await run("gzip", ["-t", archivePartial]);

    const archiveListing = await run("tar", [
      "-tzf",
      archivePartial
    ]);

    if (archiveListing.stdout.length === 0) {
      throw new Error("Archive listing is empty.");
    }

    const archiveSha256 = await sha256File(archivePartial);
    const archiveInfo = await stat(archivePartial);

    if (archiveInfo.size === 0) {
      throw new Error("Source archive is empty.");
    }

    // STEP 8: Build manifest.

    console.log("[8/10] Creating manifest...");

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
      item.provenance.some(p =>
        p.status === "NOT_REVIEWED"
      )
    );

    const manifest = {
      schemaVersion: "1.0.0",

      preservation: {
        status: "SNAPSHOT_CREATED",
        scriptVersion: "3.0.1",
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

      gitBundle: {
        file: bundleName,
        sizeBytes: bundleInfo.size,
        sha256: bundleSha256,
        verification: "PASSED",
        history: "Reachable history included where available from fetched commit."
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
        blobCount: expectedBlobCount,
        verifiedBlobCount: exportResult.verifiedBlobCount,
        exportedBytes: exportResult.exportedBytes,
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
          "Git bundle and source archive are separate preservation artifacts.",
          "Every exported blob was checked against its Git object SHA-1.",
          "Submodule contents are not included; only references are recorded.",
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

    // STEP 9: Publish verified outputs.

    console.log("[9/10] Publishing verified preservation artifacts...");

    await rename(bundlePartial, bundlePath);
    publishedFiles.push(bundlePath);

    await rename(archivePartial, archivePath);
    publishedFiles.push(archivePath);

    await writeJsonAtomic(manifestPath, manifest);
    publishedFiles.push(manifestPath);

    const report = [
      "# TheTowerSDK Preservation Report",
      "",
      `- SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`,
      `- Commit: ${actualCommit}`,
      `- Git tree SHA: ${treeSha}`,
      `- Created: ${startedAt}`,
      "",
      "## Git bundle",
      `- File: ${bundleName}`,
      `- Size: ${bundleInfo.size} bytes`,
      `- SHA-256: ${bundleSha256}`,
      "- Verification: PASSED",
      "",
      "## Source archive",
      `- File: ${archiveName}`,
      `- Size: ${archiveInfo.size} bytes`,
      `- SHA-256: ${archiveSha256}`,
      "- gzip validation: PASSED",
      "- tar listing validation: PASSED",
      "",
      "## Inventory",
      `- Entries: ${inventory.length}`,
      `- Blobs verified: ${exportResult.verifiedBlobCount}`,
      `- Exported bytes: ${exportResult.exportedBytes}`,
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
      "- Non-UTF-8 Git paths are rejected rather than silently altered.",
      "- Git bundle contains history reachable from the preserved commit, subject to upstream availability.",
      "- File provenance classification is preliminary.",
      "- Public redistribution is not approved.",
      "- SDK runtime tests have not been performed."
    ].join("\n");

    await writeFile(reportPath, report + "\n");
    publishedFiles.push(reportPath);

    // STEP 10: Final summary.

    console.log("[10/10] Preservation completed.");

    console.log(`Git bundle SHA-256: ${bundleSha256}`);
    console.log(`Archive SHA-256: ${archiveSha256}`);
    console.log(`Inventory entries: ${inventory.length}`);
    console.log(`Verified blobs: ${exportResult.verifiedBlobCount}`);

    console.log("Status: SNAPSHOT_CREATED");
    console.log("Git bundle verification: PASSED");
    console.log("Blob verification: PASSED");
    console.log("Archive verification: PASSED");
    console.log("SDK runtime tests: NOT RUN");
    console.log("Public redistribution: NOT APPROVED");

    completed = true;

  } finally {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true
    });

    if (!completed) {
      for (const path of [
        ...temporaryFiles,
        ...publishedFiles
      ]) {
        await rm(path, { force: true }).catch(() => {});
      }
    }
  }
}


main().catch(error => {
  console.error("\nPRESERVATION FAILED");
  console.error(error);
  process.exitCode = 1;
});
