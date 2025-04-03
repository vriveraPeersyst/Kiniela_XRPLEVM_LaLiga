# Kiniela - XRPL EVM LaLiga

A **LaLiga Quiniela (sports betting game)** powered by a custom on-chain Oracle and Betting contract on the **XRPL EVM** network. Includes:

1. **Next.js Frontend** + **Express.js Backend** for serving match data
2. **Oracle Contract** to store weekly matches, lock betting windows, and record results
3. **Betting Contract** to place bets, store wagers, and distribute rewards on final results
4. **Automated Node.js script** for continuously syncing real-world match results from [Football-Data.org](https://www.football-data.org/).

<br />

## Table of Contents

1. [Features](#features)  
2. [Repository Structure](#repository-structure)  
3. [Requirements](#requirements)  
4. [Installation & Setup](#installation--setup)  
5. [Running the App](#running-the-app)  
6. [How the DApp Works](#how-the-dapp-works)  
7. [Automated Oracle & Betting Script](#automated-oracle--betting-script)  
8. [Environment Variables](#environment-variables)  
9. [Contracts](#contracts)  
10. [License](#license)

<br />

## Features

- **Chain**: XRPL EVM, with the main currency as XRP.  
- **Next.js + Tailwind**: Modern UI, dark mode, and a responsive layout.  
- **wagmi + Web3Modal**: Connect to XRPL EVM wallets (MetaMask, etc.) with ease.  
- **Express.js Backend**: Provides `/api/matches` endpoint, sorting external data based on on-chain Oracle data.  
- **Oracle Contract**:
  - Keeps an official list of matches (`setWeeklyMatches`).
  - Allows or disables betting (`setBettingAllowed`).
  - Updates final results (`setMatchResults`), marking postponed/canceled as `NULL`.
- **Betting Contract**:
  - Accepts bets (`placeBet`), each user picks outcomes per match.
  - Finalizes matchday (`finalizeMatchdayAndEvaluateBets`) and distributes the pot to correct bets.

<br />

## Repository Structure

```plaintext
.
├── Kiniela_XRPLEVM_LaLiga
│   ├── .env
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── .next/               # Next.js build output
│   ├── backend/             # Express.js server
│   │   ├── server.js
│   │   └── serverOld.js
│   ├── components.json
│   ├── contracts/
│   │   ├── LaLigaMatchResultsOracle.sol
│   │   └── LaLigaQuiniela.sol
│   ├── oracle-backend/
│   │   └── quiniela-backend.js  # Automated script to poll & update results
│   ├── public/
│   │   └── MDLRlogo.JPG
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── quiniela/
│   │   │   └── services/
│   │   ├── chains/
│   │   ├── components/
│   │   ├── configs/
│   │   ├── constants/
│   │   ├── contexts/
│   │   ├── lib/
│   │   └── types.ts
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── package.json
│   └── yarn.lock
├── generate_report.sh
├── repo_report.txt
└── yarn.lock
```

**See** `generate_report.sh` + `repo_report.txt` for a detailed overview of all files.

<br />

## Requirements

1. **Node.js 16+**  
2. **Yarn** or **npm** (choose one)  
3. **XRPL EVM-compatible wallet** (MetaMask on XRPL EVM config)  
4. **Deployed Contracts** or test environment addresses  
5. **Football-Data.org API Key** (for real match data)

<br />

## Installation & Setup

1. **Clone Repo**  
   ```bash
   git clone https://github.com/youruser/Kiniela_XRPLEVM_LaLiga.git
   cd Kiniela_XRPLEVM_LaLiga
   ```

2. **Install Dependencies**  
   ```bash
   # Using Yarn:
   yarn
   # OR using NPM:
   npm install
   ```

3. **Add `.env` File**  
   ```dotenv
   FOOTBALL_API_KEY=<Your Football-Data.org API Key>
   COMPETITION_ID=<LaLiga Competition ID>  # E.g. "PD"
   WEB3_RPC_URL=<XRPL EVM RPC>
   ORACLE_CONTRACT_ADDRESS=<Deployed Oracle Address>
   BETTING_CONTRACT_ADDRESS=<Deployed Betting Address>
   PRIVATE_KEY=<Private Key for Admin calls>
   PORT=<Optional: defaults to 5589 for the backend>
   NEXT_PUBLIC_PROJECT_ID=<Web3Modal or your project ID>
   ```
   > Make sure the **PRIVATE_KEY** is the admin for both Oracle and Betting.  

4. **Build or Start**  
   - **Development**:
     ```bash
     npm run dev
     ```
     This runs both the **backend** (`server.js`) on port `5589` and **Next.js** on port `3000` (using `concurrently`).
   - **Production**:
     ```bash
     npm run build
     npm run start
     ```
     This will run Next.js in production and your Express server concurrently.

<br />

## Running the App

- **Open Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend** runs at: [http://localhost:5589](http://localhost:5589)
- **Match Data Endpoint**: [http://localhost:5589/api/matches?matchday=XXX](http://localhost:5589/api/matches?matchday=XXX)

**Note**: The `FOOTBALL_API_KEY` requests [Football-Data.org](https://www.football-data.org/) to get real matches from `competitions/PD/matches?matchday=X`.

<br />

## How the DApp Works

1. **User Flow**:
   1. User **connects wallet** via Web3Modal on the Next.js UI.
   2. Goes to **“Bet NOW”** (at `/quiniela`).
   3. The DApp fetches the official weekly matches from the **Oracle Contract** + Football API to display them in the correct order.
   4. User selects **Home/Draw/Away** for each match, then clicks **Submit Bets**.
   5. The contract call to `placeBet()` is executed on XRPL EVM, collecting the user’s stake.
   6. Later, once results are posted, the admin finalizes (`finalizeMatchdayAndEvaluateBets`) on the contract, distributing the pot to correct bettors.

2. **Oracle**:
   - The Oracle Admin sets **weekly matches**: `oracleContract.setWeeklyMatches(...)`.
   - Once matches end, the admin or the automated script calls `oracleContract.setMatchResults(...)` to record winners or `NULL`.
   - Disables betting for that matchday automatically.
   - Allows the BettingContract to finalize.

3. **Betting**:
   - Each matchday has a pot.  
   - `placeBet(...)` puts user’s stake (777 XRP in the example) into the pot.  
   - On finalization, the pot splits among those who guessed **all** non-`NULL` matches correctly.

<br />

## Automated Oracle & Betting Script

Inside `oracle-backend/quiniela-backend.js`, there’s a **polling script** that:

1. Polls the **Football-Data.org** API every minute (`pollingInterval = 60000`).
2. Compares the real match statuses (FINISHED, IN_PROGRESS, POSTPONED, etc.) with on-chain data.
3. If **all** non-rescheduled matches are done, calls:
   ```solidity
   oracleContract.setMatchResults(matchday, results);
   bettingContract.finalizeMatchdayAndEvaluateBets();
   ```
4. Handles **rescheduled** matches by marking them `NULL` until they eventually finish.

To run:
```bash
cd oracle-backend
node quiniela-backend.js
```
Keep this running in the background (on a server, Docker, etc.) to auto-update the Oracle.

<br />

## Environment Variables

| Variable                     | Purpose                                                                                     |
|-----------------------------|---------------------------------------------------------------------------------------------|
| `FOOTBALL_API_KEY`          | Key for [Football-Data.org](https://www.football-data.org/)                                |
| `COMPETITION_ID`            | Competition code, e.g. “PD” for LaLiga                                                     |
| `WEB3_RPC_URL`              | XRPL EVM RPC endpoint                                                                      |
| `ORACLE_CONTRACT_ADDRESS`   | Deployed Oracle contract address                                                           |
| `BETTING_CONTRACT_ADDRESS`  | Deployed Betting contract address                                                          |
| `PRIVATE_KEY`               | Admin’s private key to sign updates (for `setMatchResults`, etc.)                          |
| `PORT`                      | (Optional) Express server port (default 5589)                                              |
| `NEXT_PUBLIC_PROJECT_ID`    | Web3Modal / Wagmi project ID                                                               |

<br />

## Contracts

**`contracts/LaLigaMatchResultsOracle.sol`**  
- Maintains match IDs, betting status toggles, and final results.  
- Admin sets `weeklyMatches` each matchday, then updates results when done.

**`contracts/LaLigaQuiniela.sol`**  
- Accepts bets for each matchday.  
- Finalizes with the Oracle’s final results, awarding the pot to winners.

Both are written in **Solidity 0.8+** and tested on XRPL EVM.

<br />

## License

This repository is provided “as-is” under an open-source license (MIT or your chosen license).  
Feel free to modify, fork, or distribute as needed.

---

**Enjoy your LaLiga Quiniela on XRPL EVM!**  
For questions or contributions, please open an issue or pull request.
