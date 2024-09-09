"use client";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import MatchList from "./components/MatchList";
import SubmitBets from "./components/SubmitBets";
import { getMatches } from "@/app/services/bettingService";
import { Match } from "@/types";

const QuinielaPage = () => {
  const { isConnected } = useAccount();
  const [matches, setMatches] = useState<Match[]>([]);
  const matchday = 5; // Replace with dynamic matchday if needed

  // Initialize selectedBets with default "HOME_TEAM"
  const [selectedBets, setSelectedBets] = useState<string[]>(Array(10).fill("HOME_TEAM"));

  useEffect(() => {
    const fetchAndSetMatches = async (matchdayParam: number) => {
      try {
        console.log(`Requesting matches for matchday: ${matchdayParam}`); // Debug Log
        const fetchedMatches = await getMatches(matchdayParam);
        console.log('Fetched Matches:', fetchedMatches); // Debug Log
        setMatches(fetchedMatches);
      } catch (error) {
        console.error("Error fetching matches", error);
      }
    };

    const loadMatches = async () => {
      if (isConnected) {
        await fetchAndSetMatches(matchday);
      }
    };

    loadMatches();
  }, [isConnected]);

  const handleBetChange = (index: number, bet: string) => {
    const updatedBets = [...selectedBets];
    updatedBets[index] = bet;
    setSelectedBets(updatedBets);
  };

  return (
    <main className="flex flex-col items-center py-12">
      <h1 className="text-4xl font-bold mb-6">La Liga Quiniela</h1>
      {isConnected ? (
        <>
          <MatchList matches={matches} onBetChange={handleBetChange} />
          <SubmitBets  bets={selectedBets} matchday={matchday} />
        </>
      ) : (
        <p>Please connect your wallet to place bets.</p>
      )}
    </main>
  );
};

export default QuinielaPage;
