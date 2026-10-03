# Certi — On-chain Certificate Registry

Isolated Hardhat project for the `CertificateRegistry` smart contract used by
the main app (`../src/lib/blockchain/contract-service.ts`). Kept separate
from the Next.js app's `package.json` so blockchain tooling never touches
the app's build.

## One-time setup

```bash
npm install
npx hardhat compile
npm run sync-abi     # copies the compiled ABI into ../src/lib/blockchain/
```

## Local development

1. Start a local chain (leave this running in its own terminal):
   ```bash
   npm run node
   ```
2. Deploy the contract to it:
   ```bash
   npm run deploy:localhost
   ```
   Copy the printed address into the app's `.env.local` as
   `BLOCKCHAIN_CONTRACT_ADDRESS`.
3. Restart the Next.js dev server (`npm run dev` in the project root) so it
   picks up the env vars — Next only reads `.env.local` at startup.

Every time you restart the local node, its state resets (it's an in-memory
chain), so you'll need to redeploy — the contract lands at the same address
each time (deterministic, from the same deployer account + nonce), so
`.env.local` usually doesn't need updating, just re-verify it.

## Tests

```bash
npm test
```

Covers issuing, retrieving, duplicate-ID rejection, revoke authorization,
and reactivation.

## Moving to a public testnet later

No application code changes — only environment variables:

- `BLOCKCHAIN_RPC_URL` → a provider URL (Infura/Alchemy/etc.) for the target network
- `BLOCKCHAIN_PRIVATE_KEY` → a funded wallet's private key on that network
- `BLOCKCHAIN_CONTRACT_ADDRESS` → the address from deploying there

A `sepolia` network is already stubbed out in `hardhat.config.js` reading
`SEPOLIA_RPC_URL` / `DEPLOYER_PRIVATE_KEY` — deploy with:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
