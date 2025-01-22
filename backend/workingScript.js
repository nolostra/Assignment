const express = require("express");
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const cors = require("cors"); // Import CORS

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.post("/extract", upload.single("file"), async (req, res) => {
  const filePath = path.join(__dirname, req.file.path);

  try {
    // Create FormData and append the file
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), req.file.originalname);

    try {
      const response = await axios.post(
        "http://localhost:5000/extract",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
      console.log("response data:", response.data);

      // Send the extracted data back to the frontend
      res.json(response.data);
    } catch (error) {
      console.log("Error calling Python backend:", error.response?.data || error.message);
      res.status(500).send("Error processing the PDF with the Python backend");
    }
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).send("Error processing the file upload");
  } finally {
    // Clean up the uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Error cleaning up uploaded file:", cleanupError);
    }
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
