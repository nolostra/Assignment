import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  Paper,
} from "@mui/material";

const App = () => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append("file", file);

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:3000/extract", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData(response.data);
    } catch (error) {
      setError("Error uploading file. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          PDF Data Extractor
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ marginBottom: 10 }} />
          <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Extract Data"}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {file && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Selected file: {file.name}
          </Typography>
        )}

        {formData.name && (
          <Paper sx={{ p: 3, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Extracted Data
            </Typography>
            <TextField label="Name" value={formData.name} fullWidth margin="dense" InputProps={{ readOnly: true }} />
            <TextField
              label="Phone Number"
              value={formData.phone_number}
              fullWidth
              margin="dense"
              InputProps={{ readOnly: true }}
            />
            <TextField label="Address" value={formData.address} fullWidth margin="dense" InputProps={{ readOnly: true }} />
            <TextField label="Role" value={formData.role} fullWidth margin="dense" InputProps={{ readOnly: true }} />
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default App;
