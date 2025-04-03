require('dotenv').config();
const axios = require('axios');
const { ethers } = require('ethers');

const { bettingAbi, oracleAbi } = require('./abis');

const web3RpcUrl = process.env.WEB3_RPC_URL;
const provider = new ethers.JsonRpcProvider(web3RpcUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const oracleContractAddress = process.env.ORACLE_CONTRACT_ADDRESS;
const bettingContractAddress = process.env.BETTING_CONTRACT_ADDRESS;
const competitionId = process.env.COMPETITION_ID;

const oracleContract = new ethers.Contract(oracleContractAddress, oracleAbi, wallet);
const bettingContract = new ethers.Contract(bettingContractAddress, bettingAbi, wallet);

const baseUrl = 'https://api.football-data.org/v4';
const apiKey = process.env.FOOTBALL_API_KEY;

let currentMatchday = 5;
let pollingInterval = 60000;
let rescheduledMatches = [];

async function retryTransaction(transactionCallback, maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const tx = await transactionCallback();
      await tx.wait();
      console.log(`Transaction confirmed with hash: ${tx.hash}`);
      return tx;
    } catch (error) {
      attempts++;
      console.error(`Transaction failed on attempt ${attempts}:`, error.message || error);
      if (attempts >= maxRetries) throw new Error(`Transaction failed after ${maxRetries} attempts.`);
      console.log(`Retrying transaction (${attempts}/${maxRetries})...`);
    }
  }
}

async function getMatchResults(competitionId, matchday) {
  try {
    const storedMatchIDs = await oracleContract.getWeeklyMatches(matchday);
    const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { matchday }
    });
    const matches = response.data.matches;
    let results = [];
    let allFinalized = true;

    for (let i = 0; i < storedMatchIDs.length; i++) {
      const storedMatchID = storedMatchIDs[i];
      let matchFound = false;

      for (let match of matches) {
        const apiMatchID = ethers.encodeBytes32String(`${match.homeTeam.name}${match.awayTeam.name}`);
        if (apiMatchID === storedMatchID) {
          matchFound = true;
          if (rescheduledMatches.includes(match.id)) {
            console.log(`Skipping rescheduled match ${match.id}.`);
            results.push(ethers.encodeBytes32String("NULL"));
            break;
          }

          if (match.status === 'FINISHED') {
            results.push(ethers.encodeBytes32String(match.score.winner));
          } else if (["CANCELLED", "POSTPONED", "SUSPENDED"].includes(match.status)) {
            console.log(`Match ${match.id} has become ${match.status}. Adding to rescheduled group.`);
            results.push(ethers.encodeBytes32String("NULL"));
            rescheduledMatches.push(match.id);
          } else {
            allFinalized = false;
            results.push(ethers.encodeBytes32String("IN_PROGRESS"));
          }
          break;
        }
      }

      if (!matchFound) {
        console.log(`Match ID ${storedMatchID} not found in API response. Marking as NULL.`);
        results.push(ethers.encodeBytes32String("NULL"));
      }
    }

    if (allFinalized) {
      console.log(`All non-rescheduled matches for Matchday ${matchday} are finalized. Saving data...`);
      await updateResultsOracle(matchday, results);
      currentMatchday++;
    } else {
      console.log(`Some matches for Matchday ${matchday} are still in progress. Will check again later.`);
    }
  } catch (error) {
    console.error('Error fetching match results:', error.response ? error.response.data : error.message);
  }
}

async function updateResultsOracle(matchday, results) {
  try {
    await retryTransaction(() => oracleContract.setMatchResults(matchday, results, { gasLimit: 21000000 }));
    console.log(`Results updated successfully for matchday ${matchday}`);
  } catch (error) {
    console.error('Error after retries:', error.message || error);
  }

  if (rescheduledMatches.length > 0) {
    try {
      await recheckRescheduledMatches(competitionId, matchday, rescheduledMatches);
    } catch (error) {
      console.error('Error rechecking rescheduled matches:', error.message || error);
    }
  }

  try {
    await finalizeMatchdayAndEvaluateBets(matchday);
    await manageBettingStatus(competitionId, matchday + 1);
  } catch (error) {
    console.error('Error in post-result flow:', error.message || error);
  }
}

async function recheckRescheduledMatches(competitionId, matchday, rescheduledMatches) {
  try {
    const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { matchday }
    });
    const matches = response.data.matches;
    let updatedResults = [];

    rescheduledMatches.forEach(matchId => {
      const match = matches.find(m => m.id === matchId);
      if (match?.status === 'FINISHED') {
        console.log(`Rescheduled match ${match.id} has now finished. Updating result.`);
        updatedResults.push(ethers.encodeBytes32String(match.score.winner));
      } else {
        console.log(`Rescheduled match ${match?.id || matchId} is still not finished. Keeping as NULL.`);
        updatedResults.push(ethers.encodeBytes32String("NULL"));
      }
    });

    if (updatedResults.length > 0) {
      await retryTransaction(() => oracleContract.setMatchResults(matchday, updatedResults, { gasLimit: 21000000 }));
      console.log(`Updated results for rescheduled matches on Matchday ${matchday}.`);
    }
  } catch (error) {
    console.error('Error rechecking rescheduled matches:', error.message || error);
  }
}

async function setWeeklyMatches(competitionId, matchday) {
  try {
    const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { matchday }
    });
    const matches = response.data.matches;
    if (matches.length > 0) {
      const matchIDs = matches.map(match => ethers.encodeBytes32String(`${match.homeTeam.name}${match.awayTeam.name}`));
      await retryTransaction(() => oracleContract.setWeeklyMatches(matchday, matchIDs, { gasLimit: 21000000 }));
      console.log(`Weekly matches set for Matchday ${matchday}`);
    } else {
      console.log(`No matches found for Matchday ${matchday}. Weekly matches not set.`);
    }
  } catch (error) {
    console.error('Error setting weekly matches:', error.message || error);
  }
}

async function finalizeMatchdayAndEvaluateBets(matchday) {
  try {
    await retryTransaction(() => bettingContract.finalizeMatchdayAndEvaluateBets({ gasLimit: 21000000 }));
    console.log(`Finalized matchday ${matchday} and evaluated bets.`);
  } catch (error) {
    console.error('Error finalizing matchday and evaluating bets:', error.message || error);
  }
}

async function manageBettingStatus(competitionId, matchday) {
  try {
    const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      params: { matchday }
    });
    const matches = response.data.matches;
    if (matches.length > 0) {
      const firstMatchStartTime = new Date(matches[0].utcDate).getTime();
      const oneHourBeforeStart = firstMatchStartTime - 3600000;
      const currentTime = Date.now();
      const shouldAllowBetting = currentTime < oneHourBeforeStart;
      const currentBettingAllowed = await fetchBettingStatus(matchday);

      if (shouldAllowBetting !== currentBettingAllowed) {
        if (shouldAllowBetting) {
          try {
            await setWeeklyMatches(competitionId, matchday + 1);
          } catch (err) {
            console.error('Error setting weekly matches:', err.message || err);
          }
        }
        console.log(`Updating betting status for Matchday ${matchday} to ${shouldAllowBetting}.`);
        await sendBettingStatusUpdate(matchday, shouldAllowBetting);
      } else {
        console.log(`Betting status for Matchday ${matchday} is already ${currentBettingAllowed}. No update needed.`);
      }
    } else {
      console.log(`No matches found for Matchday ${matchday}. Betting status check skipped.`);
    }
  } catch (error) {
    console.error('Error managing betting status:', error.message || error);
  }
}

async function fetchBettingStatus(matchday) {
  try {
    const allowed = await oracleContract.BetsforMatchDayAllowed(matchday);
    console.log(`Current Betting Allowed for Matchday ${matchday}: ${allowed}`);
    return allowed;
  } catch (error) {
    console.error('Error fetching betting status:', error.message || error);
    throw error;
  }
}

async function sendBettingStatusUpdate(matchday, shouldAllowBetting) {
  try {
    await retryTransaction(() => oracleContract.setBettingAllowed(matchday, shouldAllowBetting, { gasLimit: 21000000 }));
    console.log(`Betting status updated for Matchday ${matchday}`);
  } catch (error) {
    console.error('Error after retries:', error.message || error);
  }
}

function startPolling() {
  setInterval(async () => {
    await manageBettingStatus(competitionId, currentMatchday);
    await new Promise(resolve => setTimeout(resolve, 20000));
    await getMatchResults(competitionId, currentMatchday);
  }, pollingInterval);
}

startPolling();
