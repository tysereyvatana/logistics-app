// A simple Express.js server for your backend.
// This file is located at /server/index.js

const express = require('express');
const cors = require('cors');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3001; // Use port 3001 for the server

// Middleware
// Enable Cross-Origin Resource Sharing (CORS) so your React app can make requests to this server
app.use(cors()); 
// Enable Express to parse JSON in the request body
app.use(express.json()); 

// --- API Routes ---

// A simple example API route to confirm the server is working.
// This will be accessible at http://localhost:3001/api/message
app.get('/api/message', (req, res) => {
  res.json({ message: "Hello from the Node.js server!" });
});

// --- Start the Server ---

// Listen for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
