const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Make sure to load environment variables

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

app.get('/api/matches', async (req, res) => {
    try {
        const { matchday } = req.query;
        console.log(`Received matchday: ${matchday}`);
        if (!matchday) {
            return res.status(400).send('Matchday is required');
        }
        const response = await axios.get(`${baseUrl}/competitions/${competitionId}/matches?matchday=${matchday}`, {
            headers: { 'X-Auth-Token': apiKey }
        });
        const matches = response.data.matches.map((match) => ({
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
        }));
        res.json(matches);
    } catch (error) {
        console.error("Error fetching match results:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
