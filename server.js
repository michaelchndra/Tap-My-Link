require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const { 
  SPOTIFY_CLIENT_ID, 
  SPOTIFY_CLIENT_SECRET, 
  SPOTIFY_REFRESH_TOKEN 
} = process.env;

// Middleware to enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const getAccessToken = async () => {
  const response = await axios.post('https://accounts.spotify.com/api/token', 
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN
    }), {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  return response.data.access_token;
};

app.get('/now-playing', async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 204) {
      return res.json({ isPlaying: false });
    }

    const data = {
      isPlaying: true,
      title: response.data.item.name,
      artist: response.data.item.artists.map(a => a.name).join(', '),
      progress_ms: response.data.progress_ms || 0,
      duration_ms: response.data.item.duration_ms,
      albumArt: response.data.item.album.images[0]?.url,
      songUrl: response.data.item.external_urls.spotify
    };

    res.json(data);
  } catch (error) {
    console.error('Spotify API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));