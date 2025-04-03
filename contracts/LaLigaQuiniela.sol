// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ILaLigaMatchResultsOracle {
    function getMatchResult(uint matchday, uint index) external view returns (bytes32);
    function getFinalizedMatchCount(uint matchday) external view returns (uint);
    function getlastMatchday() external view returns (uint);
    function BetsforMatchDayAllowed(uint matchday) external view returns (bool);
    function matchResultsReady(uint matchday) external view returns (bool);
    function getWeeklyMatches(uint matchday) external view returns (bytes32[] memory);
    function isNullMatch(uint matchday, uint index) external view returns (bool);
}

contract BettingContract is ReentrancyGuard {
    address public admin;
    ILaLigaMatchResultsOracle public oracle;
    uint public bettingMatchday;
    uint public lastMatchday;
    uint public pot;
    uint public adminPot; // New pot for admin fees
    uint public feePercentage = 10;
    address[] public participants;
    mapping(address => mapping(uint => mapping(uint => bytes32))) public bets; // Participant -> Matchday -> Index -> Prediction
    mapping(address => mapping(uint => bool)) public hasBetForMatchday;  // Track if a user has already placed a bet for a matchday

    event BetPlaced(address indexed participant, uint matchday, bytes32[] predictions);
    event PotWon(address[] winners, uint amount);
    event NewBettingRound(uint newMatchday);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyWhenBettingAllowed(uint matchday) {
        require(isBettingAllowed(matchday), "Betting is not allowed for this matchday");
        _;
    }

    modifier onlyWhenMatchResultsAreReady() {
        require(oracle.matchResultsReady(lastMatchday), "Match results not ready");
        _;
    }

    constructor(address oracleAddress) {
        admin = msg.sender;
        oracle = ILaLigaMatchResultsOracle(oracleAddress);
        lastMatchday = oracle.getlastMatchday();
        bettingMatchday = lastMatchday + 1;
    }

    // Update last matchday from the oracle
    function updateLastMatchday() public onlyAdmin {
        lastMatchday = oracle.getlastMatchday();
    }

    // Function to place a bet for a specific matchday
    function placeBet(uint matchday, bytes32[] memory predictions) public payable onlyWhenBettingAllowed(matchday) {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(!hasBetForMatchday[msg.sender][matchday], "You have already placed a bet for this matchday");

        bytes32[] memory matchIDs = oracle.getWeeklyMatches(matchday);
        require(predictions.length == matchIDs.length, "Number of predictions must match the number of matches");

        uint fee = (msg.value * feePercentage) / 100;
        uint betAmount = msg.value - fee;
        
        // Add to the admin pot for fees
        adminPot += fee;
        
        // Add to the main pot for bets
        pot += betAmount;

        // Store bets using the match index for the matchday
        for (uint i = 0; i < matchIDs.length; i++) {
            bets[msg.sender][matchday][i] = predictions[i];
        }

        participants.push(msg.sender);
        hasBetForMatchday[msg.sender][matchday] = true;

        emit BetPlaced(msg.sender, matchday, predictions);
    }

    // Function to finalize the matchday and evaluate all bets
    function finalizeMatchdayAndEvaluateBets() public onlyAdmin onlyWhenMatchResultsAreReady nonReentrant {
        uint matchCount = oracle.getFinalizedMatchCount(lastMatchday);

        // Evaluate participants' predictions and find winners
        address[] memory winners = new address[](participants.length);
        uint winnerCount = 0;

        for (uint i = 0; i < participants.length; i++) {
            address participant = participants[i];
            bool isCorrect = evaluateBet(participant, matchCount);

            if (isCorrect) {
                winners[winnerCount] = participant;
                winnerCount++;
            }
        }

        // Distribute the pot among winners
        if (winnerCount > 0) {
            uint payout = pot / winnerCount;
            for (uint i = 0; i < winnerCount; i++) {
                payable(winners[i]).transfer(payout);
            }
            emit PotWon(winners, pot);
            pot = 0;
        }

        // Reset for the next round
        resetBets();
        bettingMatchday++;
        emit NewBettingRound(bettingMatchday);
    }

    // Function to check if a participant's bet is correct
    function evaluateBet(address participant, uint matchCount) internal view returns (bool) {
        for (uint i = 0; i < matchCount; i++) {
            // Skip matches that are marked as null using correct match index logic
            if (oracle.isNullMatch(lastMatchday, i)) {
                continue;
            }

            bytes32 predictedResult = bets[participant][lastMatchday][i];
            bytes32 actualResult = oracle.getMatchResult(lastMatchday, i);
            if (predictedResult != actualResult) {
                return false;
            }
        }
        return true;
    }

    // Function to reset bets and participants for the next round
    function resetBets() internal {
        for (uint i = 0; i < participants.length; i++) {
            address participant = participants[i];
            hasBetForMatchday[participant][lastMatchday] = false;
            // Clear bets for the matchday
        }
        delete participants;
    }

    // Function to check if betting is allowed for a specific matchday
    function isBettingAllowed(uint matchday) public view returns (bool) {
        return oracle.BetsforMatchDayAllowed(matchday);
    }

    // Function to set the fee percentage by the admin
    function setFeePercentage(uint _feePercentage) public onlyAdmin {
        require(_feePercentage <= 100, "Fee percentage cannot exceed 100");
        feePercentage = _feePercentage;
    }

    // Function for the admin to withdraw collected fees from adminPot
    function withdrawAdminFees() public onlyAdmin nonReentrant {
        require(adminPot > 0, "No fees to withdraw");
        uint amount = adminPot;
        adminPot = 0;  // Reset the admin pot after withdrawal
        payable(admin).transfer(amount);
    }
}