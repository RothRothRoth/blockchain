require("@nomicfoundation/hardhat-toolbox");

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      // The contract's getCertificate() returns a struct with several
      // string fields; the legacy codegen hits "stack too deep" encoding
      // that many dynamic types in one return. viaIR (Solidity's newer
      // IR-based codegen) resolves it without restructuring the contract.
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hardhat's built-in in-process chain, used by `hardhat test`.
    hardhat: {},
    // A persistent local node started separately with `npm run node`
    // (i.e. `npx hardhat node`), so the Next.js app has something to
    // connect to over JSON-RPC while developing.
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Placeholder for a public testnet later — fill these in via env vars
    // and switch BLOCKCHAIN_RPC_URL / the app's network without touching
    // any application code (see src/lib/blockchain/contract-service.ts).
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
