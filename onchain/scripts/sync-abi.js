// Copies the compiled contract's ABI into the Next.js app's source tree, so
// the app has a checked-in, always-available copy instead of depending on
// this Hardhat project's (gitignored) build output at runtime.
//
// Run after every `npm run compile` that changes the contract's interface:
//   npm run sync-abi
const fs = require("node:fs");
const path = require("node:path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "CertificateRegistry.sol",
  "CertificateRegistry.json"
);
const outPath = path.join(
  __dirname,
  "..",
  "..",
  "src",
  "lib",
  "blockchain",
  "CertificateRegistry.abi.json"
);

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.writeFileSync(outPath, JSON.stringify(artifact.abi, null, 2) + "\n");
console.log(`Synced ABI (${artifact.abi.length} entries) to ${outPath}`);
