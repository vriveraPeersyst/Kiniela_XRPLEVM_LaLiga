import { ethers } from "ethers";
import axios from "axios";
import { oracleContractAddress, oracleContractABI } from "@/constants/contracts";

const apiKey = process.env.FOOTBALL_API_KEY;
const baseUrl = 'https://api.football-data.org/v4';
const competitionId = process.env.COMPETITION_ID || "";

export const fetchBettingStatus = async (matchday: number, signer: ethers.Signer): Promise<boolean> => {
    try {
        const oracleContract = new ethers.Contract(oracleContractAddress, oracleContractABI, signer);
        const currentBettingAllowed = await oracleContract.BetsforMatchDayAllowed(matchday);
        return currentBettingAllowed;
    } catch (error) {
        console.error("Error fetching betting status:", error);
        throw error;
    }
};

export const getMatches = async (matchday: number): Promise<any[]> => {
    try {
        const response = await axios.get(`http://localhost:5589/api/matches`, {
            params: { matchday }
        });
        console.log(response);
        return response.data;
    } catch (error) {
        console.error("Error fetching match results:", error);
        throw error;
    }
};

