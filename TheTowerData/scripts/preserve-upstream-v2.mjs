
#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Preservation v2
 *
 * Requirements:
 *   Node.js >= 20
 *   Git installed
 *
 * Usage:
 *   node TheTowerData/scripts/preserve-upstream-v2.mjs
 *
 * Optional output directory:
 *   node TheTowerData/scripts/preserve-upstream-v2.mjs ./TheTowerData/staging
 *
 * Preserves an exact upstream Git commit.
 * Does not install or execute SDK code.
 */

import {
  mkdir,
  writeFile,
  mkdtemp,
  rm,
  stat
} from "node:fs/promises";

import {
  createReadStream,
  createWriteStream
} from "node:fs";

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
  createGzip
} from "node:zlib";

import {
  pipeline
} from "node:stream/promises";


const CONFIG = {
  repository:
    "https://github.com/TmRxJD/TheTowerSDK.git",

  repositoryName:
    "TheTowerSDK",

  packageName:
    "thetowersdk",

  sdkVersion:
    "0.14.1",

  gameVersion:
    null,

  commit:
    "9a95672578fa064d71ddd54fad2ce5027a310b3a",

  outputDirectory:
    resolve(
      process.argv[2] ??
      "TheTowerData/staging/thetowersdk/0.14.1"
    )
};


const PROVENANCE_RULES = [
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
      "Orphis-related extraction/localization material. " +
      "Redistribution terms require clarification."
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
      "tower-idle-toolkit-derived material. " +
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

    child.stdout?.on("data", chunk => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", chunk => {
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

    const input = createReadStream(path);

    input.on("data", chunk => {
      hash.update(chunk);
    });

    input.on("error", reject);

    input.on("end", () => {
      resolvePromise(hash.digest("hex"));
    });
  });
}


function classifyFile(path) {

  const matches = PROVENANCE_RULES

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
        "established for this path."
    });
  }

  return matches;
}


function parseTree(raw) {

  return raw
    .split("\0")
    .filter(Boolean)
    .flatMap(record => {

      const tab = record.indexOf("\t");

      if (tab < 0) return [];

      const [mode, type, blobSha] =
        record.slice(0, tab).split(" ");

      const path = record.slice(tab + 1);

      return [{
        path,
        mode,
        type,
        gitBlobSha: blobSha,
        provenance: classifyFile(path)
      }];
    });
}


async function main() {

  const startedAt = new Date().toISOString();

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "samantha-sdk-")
  );


  console.log(
    "Samantha TheTowerSDK Preservation v2"
  );

  console.log(
    `SDK: ${CONFIG.packageName}@${CONFIG.sdkVersion}`
  );

  console.log(
    `Commit: ${CONFIG.commit}`
  );


  try {

    const repositoryDirectory = join(
      temporaryDirectory,
      "repository"
    );


    await mkdir(
      CONFIG.outputDirectory,
      { recursive: true }
    );


    // STEP 1: Initialize temporary repository

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


    // STEP 2: Fetch exact commit

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


    const actualCommit =
      commitResult.stdout.trim();


    if (actualCommit !== CONFIG.commit) {

      throw new Error(
        `Commit mismatch: expected ${CONFIG.commit}, ` +
        `received ${actualCommit}`
      );
    }


    // STEP 3: Verify package metadata

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
        "SDK package identity does not match configuration."
      );
    }


    // STEP 4: Build inventory

    console.log("[4/7] Building Git tree inventory...");


    const treeResult = await run("git", [
      "-C",
      repositoryDirectory,
      "ls-tree",
      "-rz",
      "--full-tree",
      actualCommit
    ]);


    const inventory = parseTree(
      treeResult.stdout
    );


    console.log(
      `Tracked tree entries: ${inventory.length}`
    );


    // STEP 5: Create complete source archive

    console.log("[5/7] Creating source archive...");


    const archiveName =
      `thetowersdk-${CONFIG.sdkVersion}-` +
      `${actualCommit.slice(0, 12)}.tar.gz`;


    const archivePath = join(
      CONFIG.outputDirectory,
      archiveName
    );


    const archiveProcess = spawn("git", [

      "-C",
      repositoryDirectory,

      "archive",

      "--format=tar",

      `--prefix=${CONFIG.repositoryName}-${CONFIG.sdkVersion}/`,

      actualCommit

    ], {
      stdio: ["ignore", "pipe", "pipe"]
    });


    let archiveError = "";


    archiveProcess.stderr.on("data", chunk => {
      archiveError += chunk.toString();
    });


    // Register process listeners before consuming output.

    const archiveExit = new Promise(
      (resolvePromise, reject) => {

        archiveProcess.on("error", reject);

        archiveProcess.on("close", code => {
          resolvePromise(code);
        });
      }
    );


    await pipeline(

      archiveProcess.stdout,

      createGzip({
        level: 9
      }),

      createWriteStream(archivePath)

    );


    const archiveExitCode = await archiveExit;


    if (archiveExitCode !== 0) {

      throw new Error(
        `git archive failed (${archiveExitCode}): ${archiveError}`
      );
    }


    const archiveInfo = await stat(
      archivePath
    );


    const archiveSha256 = await sha256File(
      archivePath
    );


    // STEP 6: Build manifest and report

    console.log("[6/7] Creating preservation manifest...");


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
        scriptVersion: "2.0.0"
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
          "Archive preserves the exact upstream Git tree.",
          "File classification is preliminary, not legal advice.",
          "Unidentified third-party provenance remains unreviewed.",
          "Do not publish the complete archive until licensing review."
        ]
      }

    };


    await writeFile(

      join(
        CONFIG.outputDirectory,
        "manifest.json"
      ),

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

      "## Limitations",

      "- Complete upstream Git tree archive; no path filtering was applied.",
      "- Git submodule contents, if any, are not included by git archive.",
      "- File-level license classification is preliminary.",
      "- Public redistribution is not approved.",
      "- SDK installation and runtime tests have not been performed."

    ].join("\n");


    await writeFile(

      join(
        CONFIG.outputDirectory,
        "preservation-report.md"
      ),

      report + "\n"

    );


    // STEP 7: Summary

    console.log("[7/7] Preservation completed.");

    console.log(
      `Output: ${CONFIG.outputDirectory}`
    );

    console.log(
      `Archive SHA-256: ${archiveSha256}`
    );

    console.log(
      `Inventory entries: ${inventory.length}`
    );

    console.log(
      `Files requiring license review: ${flaggedFiles.length}`
    );

    console.log("Status: SNAPSHOT_CREATED");
    console.log("SDK tests: NOT RUN");
    console.log("Public redistribution: NOT APPROVED");

  } finally {

    await rm(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
}


main().catch(error => {

  console.error("\nPRESERVATION FAILED");

  console.error(error);

  process.exitCode = 1;

});
