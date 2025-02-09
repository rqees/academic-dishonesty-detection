const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const app = express();
const port = 3000;
require("dotenv").config();
app.use(express.json());
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const form = new FormData();
    form.append("image", req.file.buffer, { filename: "image.jpg" });

    const TRANSCRIBE_API_URL =
      "https://atr.ocelus.teklia.com/api/v1/transcribe/";
    const TRANSCRIBE_API_KEY = process.env.TRANSCRIBE_API_KEY;

    const TRANSCRIBE_HEADERS = {
      ...form.getHeaders(),
      "API-Key": TRANSCRIBE_API_KEY,
    };

    const TRANSCRIBE_CONFIG = {
      method: "post",
      url: TRANSCRIBE_API_URL,
      data: form,
      headers: TRANSCRIBE_HEADERS,
    };

    const TRANSCRIBE_RESPONSE = await axios(TRANSCRIBE_CONFIG);

    let allText = "";
    const TRANSCRIBE_RESULTS = TRANSCRIBE_RESPONSE.data.results;
    for (const TRANSCRIBE_RESULT of TRANSCRIBE_RESULTS) {
      allText += TRANSCRIBE_RESULT.text + " ";
    }

    res.json(TRANSCRIBE_RESPONSE.data);

    run_ai_detection(allText)
    } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the request.");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


async function run_ai_detection(text) {
    try {
        const response = await axios.post(
            'https://api.sapling.ai/api/v1/aidetect',
            {
                key: process.env.SAPLING_DETECT_API_KEY,
                text,
            },
        );
        const {status, data} = response;
        console.log({status});
        console.log(data);
        const percent_AI = Math.floor(data.score * 10000) / 10000;
       console.log(percent_AI*100 + "%");
    } catch (err) {
        const { msg } = err.response.data;
        console.log({err: msg});
    }
}