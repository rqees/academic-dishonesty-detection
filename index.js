const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const app = express();
const port = 3000;
require('dotenv').config();


app.use(express.json());
app.use(express.static('public'));

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Create a form with the uploaded image
    const form = new FormData();
    form.append('image', req.file.buffer, { filename: 'image.jpg' });

    // Set up the CURL request options
    const TRANSCRIBE_API_URL = 'https://atr.ocelus.teklia.com/api/v1/transcribe/';
    const TRANSCRIBE_API_KEY = process.env.TRANSCRIBE_API_KEY;

    const TRANSCRIBE_HEADERS = {
      ...form.getHeaders(),
      'API-Key': TRANSCRIBE_API_KEY,
    };

    const TRANSCRIBE_CONFIG = {
      method: 'post',
      url: TRANSCRIBE_API_URL,
      data: form,
      headers: TRANSCRIBE_HEADERS,
    };

    // Make the API request using Axios
    const TRANSCRIBE_RESPONSE = await axios(TRANSCRIBE_CONFIG);

        // Extract and append all text from the response
    let allText = '';
    const TRANSCRIBE_RESULTS = TRANSCRIBE_RESPONSE.data.results;
    for (const TRANSCRIBE_RESULT of TRANSCRIBE_RESULTS) {
       allText += TRANSCRIBE_RESULT.text + ' ';
     }
    
 // Log the concatenated text to the server console
    console.log('Concatenated Text:', allText);

    // Send the API response back to the client
    res.json(TRANSCRIBE_RESPONSE.data);



    //AI Detection API 

    const DETECT_API_KEY = process.env.DETECT_API_KEY;
    const DETECT_PUBLIC_BEARER = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZ3NzdXRyaHpya2xsc3RnbGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY2ODc5MjMsImV4cCI6MjAwMjI2MzkyM30.bwSe1TrFMhcosgqFSlGIhMIv9fxohzLG0eyBEs7wUo8';


    let AI_DETECT_DATA = JSON.stringify({
      "api_key": DETECT_API_KEY,
      "text": allText
    });
    
    let AI_DETECT_CONFIG = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.gowinston.ai/functions/v1/predict',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': DETECT_PUBLIC_BEARER
      },
      data : AI_DETECT_DATA
    };

    try { 
      axios.request(AI_DETECT_CONFIG)
      .then((response) => {
        var humanScore = JSON.stringify(response.data.score);
        var aiScore = 100 - humanScore;
        console.log('AI Score: ' + aiScore);
      })
      .catch((error) => {
        console.log(error);
      });
      } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data from the Winston AI API.' });
      }
  
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the request.');
  }
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
