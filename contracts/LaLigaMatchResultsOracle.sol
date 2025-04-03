// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LaLigaMatchResultsOracle {
    address public admin;
    uint public lastMatchday;
    
    // Mapping from matchday to indexed matches (index -> matchID)
    mapping(uint => mapping(uint => bytes32)) public matchIndexForMatchday;  // Map matchday -> index -> matchID
    mapping(uint => bytes32[]) public weeklyMatchesForMatchday;  // Store matches for each matchday
    mapping(uint => bool) public matchResultsReadyForMatchday;
    mapping(uint => bool) public bettingAllowedForMatchday;
    mapping(uint => uint) public finalizedMatchCount;  // Track the number of finalized matches per matchday
    
    // New mapping: Track null matches by matchID
    mapping(uint => mapping(bytes32 => bool)) public isNullMatchForMatchday;  // Map matchday -> matchID -> bool

    bytes32 constant encodedNull = bytes32("NULL");  // Predefined value for null matches

    event MatchResultsUpdated(uint matchday, bytes32[] results);
    event BettingStatusUpdated(uint matchday, bool allowed);
    event WeeklyMatchesSet(uint matchday, bytes32[] matchIDs);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Set the weekly matches for a specific matchday, while creating the index for each match
    function setWeeklyMatches(uint matchday, bytes32[] memory matchIDs) public onlyAdmin {
        require(matchIDs.length > 0, "No matches provided for this matchday");

        weeklyMatchesForMatchday[matchday] = matchIDs;

        // Map each match ID to an index for the matchday
        for (uint i = 0; i < matchIDs.length; i++) {
            matchIndexForMatchday[matchday][i] = matchIDs[i];
        }

        emit WeeklyMatchesSet(matchday, matchIDs);
    }

    // Set match results for a given matchday
    function setMatchResults(uint matchday, bytes32[] memory _results) public onlyAdmin {
        require(_results.length == weeklyMatchesForMatchday[matchday].length, "Results length mismatch with weekly matches");
        
        for (uint i = 0; i < _results.length; i++) {
            bytes32 matchID = matchIndexForMatchday[matchday][i];

            if (_results[i] == encodedNull) {
                // Flag null matches by setting them in the isNullMatchForMatchday mapping
                isNullMatchForMatchday[matchday][matchID] = true;
                matchIndexForMatchday[matchday][i] = _results[i];
            } else {
                // Store the results for non-null matches
                matchIndexForMatchday[matchday][i] = _results[i];
            }
        }
        
        matchResultsReadyForMatchday[matchday] = true;
        finalizedMatchCount[matchday] = _results.length;
        lastMatchday = matchday;
        bettingAllowedForMatchday[matchday] = false;  // Disable betting once results are set
        emit MatchResultsUpdated(matchday, _results);
    }

    // Get match result for a given matchday and index
    function getMatchResult(uint matchday, uint index) external view returns (bytes32) {
        return matchIndexForMatchday[matchday][index];
    }

    // Check if a specific match is null by referencing the correct match ID from weeklyMatchesForMatchday
    function isNullMatch(uint matchday, uint index) external view returns (bool) {
        bytes32 matchID = matchIndexForMatchday[matchday][index];
        return isNullMatchForMatchday[matchday][matchID];
    }

    // Check if match results are ready for a specific matchday
    function matchResultsReady(uint matchday) external view returns (bool) {
        return matchResultsReadyForMatchday[matchday];
    }

    // Get the number of finalized matches for a specific matchday
    function getFinalizedMatchCount(uint matchday) external view returns (uint) {
        return finalizedMatchCount[matchday];
    }

    // Get the full array of matches for a given matchday
    function getWeeklyMatches(uint matchday) external view returns (bytes32[] memory) {
        return weeklyMatchesForMatchday[matchday];
    }

    // Allow or disable betting for a specific matchday
    function setBettingAllowed(uint matchday, bool allowed) public onlyAdmin {
        bettingAllowedForMatchday[matchday] = allowed;
        emit BettingStatusUpdated(matchday, allowed);
    }

    // Check if betting is allowed for a specific matchday
    function BetsforMatchDayAllowed(uint matchday) external view returns (bool) {
        return bettingAllowedForMatchday[matchday];
    }

    // Get the last matchday that was set
    function getlastMatchday() external view returns (uint) {
        return lastMatchday;
    }
}