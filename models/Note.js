const mongoose = require('mongoose');

// Define the schema for notes
const NoteSchema = new mongoose.Schema({
  noteName: {
    type: String,
    required: true, // Make noteName a required field
    trim: true // Remove extra spaces
  },
  duration: {
    type: Number,
    required: true // Make duration a required field
  },
  createdAt: {
    type: Date,
    default: Date.now // Automatically set the creation date
  }
});

// Create the Note model
const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;