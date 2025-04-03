```markdown
# Kiniela XRPL EVM - LaLiga

This project is a **LaLiga Quiniela** (sports prediction) decentralized application running on the **XRPL EVM** chain. It uses a Next.js frontend and an Express.js backend. Bets and match information are sourced from:

1. An **external football API** (via `api.football-data.org`)
2. An on-chain **Oracle contract** providing official matchday order and betting status
3. A **Betting contract** for placing wagers using XRP.

The frontend is built with Next.js (React) and TailwindCSS, while the backend uses Express.js to fetch data from the football API and serve it to the client.

---

## Features

- **Match Data Fetching**: The backend calls `api.football-data.org` and references the Oracle Contract on XRPL EVM to figure out the exact match ordering.
- **Placing Bets**: The frontend communicates with the Betting Contract on XRPL EVM to submit your wagers (predictions) for each match.
- **On-Chain Logic**: Both the Oracle Contract (for official match info) and the Betting Contract (for handling wagers and payouts) reside on XRPL EVM.
- **Modern Web3 Integration**: Uses wagmi, Web3Modal, and ethers for connecting wallets and handling transactions.
- **TailwindCSS**: For styling the Next.js app with support for dark mode and custom theming.

---

## Prerequisites

- **Node.js** (v16+ recommended)
- **Yarn** or **npm** (your preference)
- **An XRPL EVM-compatible wallet** or injected provider (e.g., MetaMask in an XRPL EVM configured environment)
- **A `.env` file** with the required environment variables (see below)

---

## Project Structure

See the [repo_report.txt](./repo_report.txt) or just run `./generate_report.sh` to view a comprehensive list of files and their contents. Brief overview:

```
Kiniela_XRPLEVM_LaLiga
├── backend
│   ├── server.js          # Main Express.js server
│   ├── serverOld.js       # Old server reference
│   └── package.json
├── src
│   ├── app
│   │   ├── services
│   │   ├── quiniela
│   │   └── page.tsx       # Main Next.js page
│   ├── chains
│   ├── components         # Reusable UI components
│   ├── constants          # Contract ABIs and addresses
│   ├── contexts           # React context for Web3Modal
│   ├── lib                # Utility functions
│   └── types.ts           # Shared TypeScript types
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

Create a file named `.env` (in the `Kiniela_XRPLEVM_LaLiga` directory) and set the following:

```dotenv
# Football Data API
FOOTBALL_API_KEY=<YOUR_FOOTBALL_DATA_API_KEY>
COMPETITION_ID=<LA_LIGA_COMPETITION_ID> 
   # For La Liga, typically "PD" or a specific numeric ID, depending on your subscription

# XRPL EVM Node
WEB3_RPC_URL=<XRPL_EVM_RPC_URL>

# Oracle Contract
ORACLE_CONTRACT_ADDRESS=<YOUR_ORACLE_CONTRACT_ADDRESS>

# Betting Contract
BETTING_CONTRACT_ADDRESS=<YOUR_BETTING_CONTRACT_ADDRESS>

# Deployer's Private Key (if needed by the backend for updating data on chain)
PRIVATE_KEY=<PRIVATE_KEY_FOR_BACKEND_ACTIONS>

# Web3Modal / Wagmi
NEXT_PUBLIC_PROJECT_ID=<YOUR_WEB3MODAL_PROJECT_ID>
```

> **Note**: `PRIVATE_KEY` is only used if you want the backend to sign transactions that update the betting or oracle contract. If you only rely on the frontend for user-signed transactions, you can omit it.

---

## Installation and Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/youruser/Kiniela_XRPLEVM_LaLiga.git
   cd Kiniela_XRPLEVM_LaLiga
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn
   ```

3. **Set up environment**:
   - Create a `.env` file (as above) with your credentials and addresses.

4. **Run in development**:
   ```bash
   npm run dev
   ```
   This will:
   - Start the Express backend on port `5589`.
   - Start the Next.js frontend on port `3000`.

5. **Open the app**:
   - Go to [http://localhost:3000](http://localhost:3000) in your browser.
   - The backend endpoints are served at `http://localhost:5589/api/...`.

6. **Production build**:
   ```bash
   # Build for production
   npm run build

   # Then run the production server
   npm run start
   ```
   - This concurrently starts the backend (`server.js`) and the Next.js production build.

---

## Usage

1. **Connect your wallet** (configured to XRPL EVM) with the **“Connect Wallet”** button.
2. **Go to Quiniela**: Click the "Bet NOW" button or navigate to `/quiniela`.
3. **Select predictions**: For each match, choose **Home Win**, **Draw**, or **Away Win**.
4. **Submit Bets**: Click **“Submit Bets”**. A wallet transaction will pop up for confirmation.
5. **Transaction**: Wait for the transaction to confirm on the XRPL EVM chain. You’ll see a success message once confirmed.

---

## How It Works (High-Level)

- **LaLiga Oracle**:
  - The Oracle Contract stores weekly matches (identified by TLA pairs like `FCBATM` for Barcelona vs. Atlético Madrid).
  - `server.js` calls the Oracle Contract to read an ordered list of matches for a given `matchday`.
  - It then queries the public football API (`api.football-data.org`) using `FOOTBALL_API_KEY`, retrieves match data, and reorders it to match the Oracle’s official sequence.

- **Betting Contract**:
  - The frontend uses `wagmi` hooks to sign a transaction that invokes `placeBet(...)`.
  - Bets are stored on-chain, referencing the current `matchday`.
  - The bet amount is included in the transaction’s value (e.g., 777 XRP).
  - Once final results are provided to the Oracle Contract, the Betting Contract can evaluate winners.

---

## Scripts

- **`generate_report.sh`**: Creates `repo_report.txt`, listing the entire file tree (skipping `node_modules`) and contents of important files. Useful for debugging or an overview of changes.

- **`lint`**: Runs ESLint checks:
  ```bash
  npm run lint
  ```

- **`build`**: Builds the Next.js app for production.

- **`start`**: Runs both the production Next.js server and the backend server.

---

## Contributing

1. Fork the repository.
2. Create a new branch for your feature/fix.
3. Commit changes with descriptive messages.
4. Push and create a Pull Request.

---

## License

This project is provided “as-is” under an open-source license. See [LICENSE](LICENSE) file (if provided) for details.
```