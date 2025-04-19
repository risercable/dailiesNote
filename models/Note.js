const mongoose = require('mongoose');

// Define the schema for notes
const NoteSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true // Make duration a required field
  },
  data: [{
    day: {
      type: String,
      required: true, // Make noteName a required field
      trim: true // Remove extra spaces
    },
    title: {
      type: String,
      required: true, // Make noteName a required field
      trim: true // Remove extra spaces
    },
    start: {
      type: String,
      required: true, // Make noteName a required field
      trim: true // Remove extra spaces
    },
    end: {
      type: String,
      required: true, // Make noteName a required field
      trim: true // Remove extra spaces
    },
    createdAt: {
      type: Date,
      default: Date.now // Automatically set the creation date
    },
  }],
});

// Create the Note model
const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;