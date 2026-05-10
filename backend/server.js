import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parsePDF } from './utils/pdfParser.js';
import { chunkDocuments } from './utils/chunker.js';
import { storeInQdrant } from './utils/vectorStore.js';
import { retrieveRelevantChunks } from './utils/retriever.js';
import { generateAnswer } from './utils/generator.js';

// 1. Initialize environment variables from .env file
dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Setup Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse incoming JSON requests

// 3. Setup Multer for handling file uploads
// We configure multer to store files in the 'uploads/' directory and keep their original extension.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the folder where PDFs will be saved
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp + original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 4. Routes
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running normally!' });
});

// Upload route
// Expects a form-data request with the key 'documents' containing the PDF files
app.post('/api/upload', upload.array('documents', 25), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded or files are not PDFs.' });
    }

    let allDocs = [];
    let uploadedFilesData = [];

    // Process each uploaded PDF
    for (const file of req.files) {
      // 1. Parse it
      const docs = await parsePDF(file.path);
      allDocs.push(...docs);
      
      uploadedFilesData.push({
        filename: file.originalname,
        size: file.size
      });
    }

    // 2. Break the aggregated document texts into smaller chunks
    const chunks = await chunkDocuments(allDocs);

    // 3. Convert chunks into embeddings and store them in Qdrant
    await storeInQdrant(chunks);

    // Return the file details to the frontend
    res.status(200).json({
      message: 'Files uploaded, parsed, chunked, and stored in Qdrant successfully!',
      files: uploadedFilesData,
      totalChunksStored: chunks.length
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload or process the documents.' });
  }
});

// Ask route
// Expects a JSON body: { "question": "What is Node.js?" }
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Please provide a question.' });
    }

    // Pass the question to our retrieval utility to get the top 3 chunks
    const relevantChunks = await retrieveRelevantChunks(question);

    // Pass the retrieved chunks and the question to our LLM to generate the final answer
    const aiAnswer = await generateAnswer(question, relevantChunks);

    res.status(200).json({
      message: 'Successfully generated answer!',
      question: question,
      answer: aiAnswer,
      sources: relevantChunks.map(chunk => chunk.pageContent) // Show the user what we based the answer on
    });
  } catch (error) {
    console.error('Ask Route Error:', error);
    res.status(500).json({ error: 'Failed to retrieve answers.' });
  }
});

// 5. Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
