const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./db'); // Import the MongoDB connection file
const cors = require('cors'); // Import CORS middleware
const Note = require('./models/Note'); // Import the Note model

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cors({
  origin: 'http://localhost:4200', // Replace with your Angular app's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow cookies if needed
}));

// Example Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.post('/enders', (req, res) => {
  console.log('POST /api/enders called');
  console.log('Request body:', req.body);

  const { data } = req.body;
  res.json({ message: 'Data received', data });
});

app.post('/api/notes', async (req, res) => {
  try {
    const { noteName, duration } = req.body;

    // Create a new note
    const newNote = new Note({
      noteName,
      duration
    });

    // Save the note to the database
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('Error creating note:', error.message);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));