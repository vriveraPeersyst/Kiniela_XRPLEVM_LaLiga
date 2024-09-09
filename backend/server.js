const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5589;

const apiKey = process.env.FOOTBALL_API_KEY;
const baseUrl = 'https://api.football-data.org/v4';
const competitionId = process.env.COMPETITION_ID || "";

// Apply CORS middleware at the top
const corsOptions = {
    origin: 'http://localhost:3000', // Allow only this origin
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // This should be above the routes


// Set up provider and contract instance for Oracle Contract
const web3RpcUrl = process.env.WEB3_RPC_URL;
const provider = new ethers.JsonRpcProvider(web3RpcUrl);
const oracleContractAddress = process.env.ORACLE_CONTRACT_ADDRESS;
const oracleAbi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "allowed",
                "type": "bool"
            }
        ],
        "name": "BettingStatusUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes32[]",
                "name": "results",
                "type": "bytes32[]"
            }
        ],
        "name": "MatchResultsUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes32[]",
                "name": "matchIDs",
                "type": "bytes32[]"
            }
        ],
        "name": "WeeklyMatchesSet",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            }
        ],
        "name": "BetsforMatchDayAllowed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "admin",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "bettingAllowedForMatchday",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "finalizedMatchCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            }
        ],
        "name": "getFinalizedMatchCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getMatchResult",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            }
        ],
        "name": "getWeeklyMatches",
        "outputs": [
            {
                "internalType": "bytes32[]",
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getlastMatchday",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "isNullMatch",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "isNullMatchForMatchday",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "lastMatchday",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "matchIndexForMatchday",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            }
        ],
        "name": "matchResultsReady",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "matchResultsReadyForMatchday",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "allowed",
                "type": "bool"
            }
        ],
        "name": "setBettingAllowed",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "internalType": "bytes32[]",
                "name": "_results",
                "type": "bytes32[]"
            }
        ],
        "name": "setMatchResults",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "matchday",
                "type": "uint256"
            },
            {
                "internalType": "bytes32[]",
                "name": "matchIDs",
                "type": "bytes32[]"
            }
        ],
        "name": "setWeeklyMatches",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "weeklyMatchesForMatchday",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]; 
const oracleContract = new ethers.Contract(oracleContractAddress, oracleAbi, provider);


app.get('/api/matches', async (req, res) => {
    try {
        const { matchday } = req.query;
        console.log(`Received matchday: ${matchday}`);
        if (!matchday) {
            return res.status(400).send('Matchday is required');
        }

        // Fetch ordered weekly matches from Oracle contract
        const weeklyMatches = await oracleContract.getWeeklyMatches(matchday);
        const orderedMatchIDs = weeklyMatches.map(matchID => ethers.decodeBytes32String(matchID));
        console.log(orderedMatchIDs);

        // Fetch matches from external football API
        const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches`, {
            headers: { 'X-Auth-Token': apiKey },
            params: { matchday: matchday }
        });

        // Extract and encode match data from API using TLA (Three-Letter Acronym) for matchID
        const matches = response.data.matches.map((match) => ({
            homeTeam: match.homeTeam.name,  // Full name for display
            awayTeam: match.awayTeam.name,  // Full name for display
            homeTeamTLA: match.homeTeam.tla,  // Three-Letter Acronym (TLA)
            awayTeamTLA: match.awayTeam.tla,  // Three-Letter Acronym (TLA)
            matchID: `${match.homeTeam.tla}${match.awayTeam.tla}`  // Generate matchID from TLA
        }));

        console.log(matches);

        // Sort API matches to match the order of weeklyMatches from Oracle contract
        const sortedMatches = orderedMatchIDs.map(matchID => {
            return matches.find(match => match.matchID === matchID);
        }).filter(Boolean); // Filter out any matches that couldn't be matched

        console.log(sortedMatches);

        // Map sorted matches to only include homeTeam and awayTeam
        const responseMatches = sortedMatches.map(match => ({
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam
        }));

        console.log(responseMatches);

        // Return only the filtered match info
        res.json(responseMatches);
    } catch (error) {
        console.error("Error fetching match results:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
