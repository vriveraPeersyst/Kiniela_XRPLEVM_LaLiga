import { ethers } from "ethers";
import axios from "axios";
import { oracleContractAddress, oracleContractABI } from "@/constants/contracts";

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.WEB3_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
const oracleContract = new ethers.Contract(oracleContractAddress, oracleContractABI, wallet);

const apiKey = process.env.FOOTBALL_API_KEY;
const baseUrl = 'https://api.football-data.org/v4';
const competitionId = process.env.COMPETITION_ID || "";

export const fetchBettingStatus = async (matchday: number): Promise<boolean> => {
    try {
        const currentBettingAllowed = await oracleContract.BetsforMatchDayAllowed(matchday);
        return currentBettingAllowed;
    } catch (error) {
        console.error("Error fetching betting status:", error);
        throw error;
    }
};

export const getMatchResults = async (matchday: number): Promise<any[]> => {
    try {
        const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches`, {
            headers: { 'X-Auth-Token': apiKey },
            params: { matchday }
        });

        const matches = response.data.matches.map((match: any) => ({
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
        }));

        return matches;
    } catch (error) {
        console.error("Error fetching match results:", error);
        throw error;
    }
};
