import React from "react";
import { Match } from "@/types";

const MatchList = ({
  matches,
  onBetChange,
}: {
  matches: Match[];
  onBetChange: (index: number, bet: string) => void;
}) => {
  return (
    <div className="match-list">
      {matches.map((match, index) => (
        <div key={index} className="match-item">
          <span>{match.homeTeam} vs {match.awayTeam}</span>
          <select
            onChange={(e) => onBetChange(index, e.target.value)}
            defaultValue="HOME_TEAM" // Set default value to HOME_TEAM
          >
            <option value="HOME_TEAM">Home Win</option>
            <option value="DRAW">Draw</option>
            <option value="AWAY_TEAM">Away Win</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default MatchList;
