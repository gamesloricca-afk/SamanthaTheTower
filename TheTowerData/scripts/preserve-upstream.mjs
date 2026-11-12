
#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation Script
 *
 * Requirements:
 *   Node.js >= 20
 *   Git installed
 *
 * Usage:
 *   node TheTowerData/scripts/preserve-upstream.mjs
 *
 * Optional:
 *   node TheTowerData/scripts/preserve-upstream.mjs ./TheTowerData/staging
 *
 * This script:
 *   - Fetches an exact upstream commit
 *   - Verifies the commit SHA
 *   - Creates a complete source archive
 *   - Calculates archive SHA-256
 *   - Creates a complete Git tree inventory
 *   - Flags known third-party provenance areas
 *
 * It does NOT:
 *   - Modify upstream files
 *   - Filter or delete source files
 *   - Install or execute SDK code
 *   - Commit or push files
 *   - Declare third-party material legally cleared
 */

import {
  mkdir,
  writeFile,
  readFile,
  mkdtemp,
  rm,
  stat
} from "node:fs/promises";

import {
  createHash
} from "node:crypto";

import {
  tmpdir
} from "node:os";

import {
  join,
  resolve
} from "node:path";

import {
  spawn
} from "node:child_process";

import {
  createWriteStream
} from "node:fs";

import {
  createGzip
} from "node:zlib";

import {
  pipeline
} from "node:stream/promises";

import {
  Transform
} from "node:stream";

const CONFIG = {
  repository: "https://github.com/TmRxJD/TheTowerSDK.git",
  repositoryName: "TheTowerSDK",
  packageName: "thetowersdk",
  sdkVersion: "0.14.1",
  gameVersion: null,

  commit:
    "9a95672578fa064d71ddd54fad2ce5027a310b3a",

  outputDirectory:
    resolve(
      process.argv[2] ??
      "TheTowerData/staging/thetowersdk/0.14.1"
    )
};

const KNOWN_PROVENANCE_RULES = [
  {
    id: "EFFECTIVE_PATHS",
    patterns: [
      /effective-paths/i,
      /effective.paths/i
    ],
    status: "CLARIFICATION_REQUIRED",
    reason:
      "Community spreadsheet-derived material. " +
      "Redistribution scope requires clarification."
  },
  {
    id: "ORPHIS",
    patterns: [
      /labs-categories\.generated/i,
      /lab-categories\.json/i
    ],
    status: "CLARIFICATION_REQUIRED",
    reason:
      "NOTICE identifies Orphis-related extraction or " +
      "localization material. Redistribution terms require clarification."
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
      "NOTICE identifies tower-idle-toolkit-derived material. " +
      "Preserve ISC attribution and verify applicable files."
  }
];

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", code => {
      if (code !== 0) {
        reject(
          new Error(
            `${command} exited with code ${code}\n${stderr}`
          )
        );
        return;
      }

      resolvePromise({
        stdout,
        stderr
      });
    });
  });
}

function sha256File(path) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createWriteStream("/dev/null");

    // Hashing is performed separately below using read streams.
    stream.destroy();

    import("node:fs").then(({ createReadStream }) => {
      const input = createReadStream(path);

      input.on("data", chunk => hash.update(chunk));
      input.on("error", reject);

      input.on("end", () => {
        resolvePromise(hash.digest("hex"));
      });
    }).catch(reject);
  });
}

function classifyFile(path) {
  const matches = [];

  for (const rule of KNOWN_PROVENANCE_RULES) {
    if (rule.patterns.some(pattern => pattern.test(path))) {
      matches.push({
        id: rule.id,
        status: rule.status,
        reason: rule.reason
      });
    }
  }

  if (
    /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i.test(path)
  ) {
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
      reason:
        "No specific third-party provenance classification " +
        "has been established for this path."
    });
  }

  return matches;
}

function parseTree(raw) {
  const entries = [];
  const records = raw.split("\0").filter(Boolean);

  for (const record of records) {
    const tab = record.indexOf("\t");

    if (tab < 0) continue;

    const metadata = record.slice(0, tab);
    const path = record.slice(tab + 1);

    const [mode, type, blobSha] = metadata.split(" ");

    entries.push({
      path,
      mode,
      type,
      gitBlobSha: blobSha,
      provenance: classifyFile(path)
    });
  }

  return entries;
}

async function main() {
  const startedAt = new Date().toISOString();

  console.log("Samantha TheTowerSDK Preservation");
  console.log("----------------------------------");
  console.log(`SDK: ${CONFIG.packageName}`);
  console.log(`Version: ${CONFIG.sdkVersion}`);
  console.log(`Commit: ${CONFIG.commit}`);

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "samantha-sdk-")
  );

  try {
    const repositoryDirectory = join(
      temporaryDirectory,
      "repository"
    );

    await mkdir(CONFIG.outputDirectory, {
      recursive: true
    });

    console.log("\n[1/7] Initializing repository...");

    await run("git", [
      "init",
      repositoryDirectory
    ]);

    await run("git", [
      "-C",
      repositoryDirectory,
      "remote",
      "add",
      "origin",
      CONFIG.repository
    ]);

    console.log("[2/7] Fetching exact upstream commit...");

    await run("git", [
      "-C",
      repositoryDirectory,
      "fetch",
      "--depth=1",
      "origin",
      CONFIG.commit
    ]);

    const commitResult = await run("git", [
      "-C",
      repositoryDirectory,
      "rev-parse",
      "FETCH_HEAD^{commit}"
    ]);

    const actualCommit = commitResult.stdout.trim();

    if (actualCommit !== CONFIG.commit) {
      throw new Error(
        `Commit mismatch. Expected ${CONFIG.commit}, ` +
        `received ${actualCommit}`
      );
    }

    console.log("[3/7] Verifying package metadata...");

    const packageResult = await run("git", [
      "-C",
      repositoryDirectory,
      "show",
      `${actualCommit}:package.json`
    ]);

    const packageMetadata = JSON.parse(
      packageResult.stdout
    );

    if (
      packageMetadata.name !== CONFIG.packageName ||
      packageMetadata.version !== CONFIG.sdkVersion
    ) {
      throw new Error(
        "SDK package metadata does not match expected identity."
      );
    }

    console.log("[4/7] Building complete file inventory...");

    const treeResult = await run("git", [
      "-C",
      repositoryDirectory,
      "ls-tree",
      "-rz",
      "--full-tree",
      actualCommit
    ]);

    const inventory = parseTree(treeResult.stdout);

    console.log(
      `Found ${inventory.length} tracked tree entries.`
    );

    console.log("[5/7] Creating complete source archive...");

    const archiveName =
      `thetowersdk-${CONFIG.sdkVersion}-` +
      `${actualCommit.slice(0, 12)}.tar.gz`;

    const archivePath = join(
      CONFIG.outputDirectory,
      archiveName
    );

    const archiveProcess = spawn(
      "git",
      [
        "-C",
        repositoryDirectory,
        "archive",
        "--format=tar",
        `--prefix=${CONFIG.repositoryName}-${CONFIG.sdkVersion}/`,
        actualCommit
      ],
      {
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let archiveError = "";

    archiveProcess.stderr.on("data", chunk => {
      archiveError += chunk.toString();
    });

    const gzip = createGzip({
      level: 9,
      mtime: 0
    });

    await pipeline(
      archiveProcess.stdout,
      gzip,
      createWriteStream(archivePath)
    );

    const archiveExitCode = await new Promise(
      (resolvePromise, reject) => {
        archiveProcess.on("error", reject);
        archiveProcess.on("close", resolvePromise);
      }
    );

    if (archiveExitCode !== 0) {
      throw new Error(
        `git archive failed: ${archiveError}`
      );
    }

    const archiveInfo = await stat(archivePath);
    const archiveSha256 = await sha256File(archivePath);

    console.log("[6/7] Preserving license documents...");

    const licenseFiles = inventory
      .filter(item =>
        /(^|\/)(LICENSE|NOTICE|COPYING)(\.|$)/i
          .test(item.path)
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
        createdAt: new Date().toISOString(),
        scriptVersion: "1.0.0"
      },

      source: {
        repository: CONFIG.repository,
        repositoryName: CONFIG.repositoryName,
        packageName: packageMetadata.name,
        sdkVersion: packageMetadata.version,
        gameVersion: CONFIG.gameVersion,
        commit: actualCommit,
        packageLicense: packageMetadata.license,
        nodeRequirement:
          packageMetadata.engines?.node ?? null
      },

      archive: {
        file: archiveName,
        format: "tar.gz",
        sizeBytes: archiveInfo.size,
        sha256: archiveSha256
      },

      inventory: {
        totalEntries: inventory.length,
        licenseDocuments: licenseFiles,
        flaggedFileCount: flaggedFiles.length,
        notReviewedFileCount: notReviewedFiles.length,
        entries: inventory
      },

      licensing: {
        overallStatus: "REVIEW_REQUIRED",
        thirdPartyReviewRequired: true,
        publicRedistributionApproved: false,
        notes: [
          "This archive preserves the exact upstream Git tree.",
          "File classification is preliminary, not legal advice.",
          "Unidentified third-party provenance remains unreviewed.",
          "Do not publish the complete archive until licensing review."
        ]
      }
    };

    await writeFile(
      join(CONFIG.outputDirectory, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n"
    );

    const report = [
      "# TheTowerSDK Preservation Report",
      "",
      `- SDK version: ${CONFIG.sdkVersion}`,
      `- Commit: ${actualCommit}`,
      `- Created: ${startedAt}`,
      `- Archive: ${archiveName}`,
      `- Archive size: ${archiveInfo.size} bytes`,
      `- SHA-256: ${archiveSha256}`,
      `- Inventory entries: ${inventory.length}`,
      `- License documents: ${licenseFiles.length}`,
      `- Files requiring license review: ${flaggedFiles.length}`,
      `- Files not individually reviewed: ${notReviewedFiles.length}`,
      "",
      "## License documents",
      ...licenseFiles.map(path => `- ${path}`),
      "",
      "## Files requiring license review",
      ...flaggedFiles.map(item =>
        `- ${item.path}: ` +
        item.provenance
          .map(p => `${p.id} (${p.status})`)
          .join(", ")
      ),
      "",
      "## Important limitations",
      "- The archive is a complete upstream snapshot.",
      "- No files have been filtered or modified.",
      "- File-level license status is preliminary.",
      "- Public redistribution is not approved by this report.",
      "- SDK execution and import tests have not been performed."
    ].join("\n");

    await writeFile(
      join(CONFIG.outputDirectory, "preservation-report.md"),
      report + "\n"
    );

    console.log("[7/7] Preservation completed.");

    console.log("\nOutput:");
    console.log(CONFIG.outputDirectory);
    console.log(`Archive SHA-256: ${archiveSha256}`);
    console.log(`Inventory: ${inventory.length} entries`);
    console.log(`License review: ${flaggedFiles.length} files`);

    console.log("\nStatus: SNAPSHOT_CREATED");
    console.log("SDK tests: NOT RUN");
    console.log("Public redistribution: NOT APPROVED");

  } finally {
    await rm(temporaryDirectory, {
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
