const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./db'); // Import the MongoDB connection file
const cors = require('cors'); // Import CORS middleware
const Note = require('./models/Note'); // Import the Note model
const mongoose = require('mongoose');

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

app.post('/api/notes', async (req, res) => {
  try {
    const {id, data } = req.body;

    // Create a new note
    const newNote = new Note({
      id,
      data
    });

    // Save the note to the database
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('Error creating note:', error.message);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.get('/api/getNotes', async (req, res) => {
  try {
    const collections = await Note.find();
    res.json(collections);
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));