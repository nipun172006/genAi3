import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";

/**
 * Creates embeddings for chunks and stores them in Qdrant Vector DB.
 * 
 * @param {Array} chunks - The array of document chunks.
 */
export const storeInQdrant = async (chunks) => {
  try {
    console.log("Starting Embedding and Storage process...");

    // 1. Initialize the Embedding Model
    // We use HuggingFace's free inference API to turn our text into numbers.
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY, 
      // We use a small, fast model good for sentence embeddings
      model: "sentence-transformers/all-MiniLM-L6-v2", 
    });

    // 2. Connect to Qdrant and store the chunks
    // This function automatically creates the collection if it doesn't exist,
    // converts the chunks into vectors, and saves them.
    const vectorStore = await QdrantVectorStore.fromDocuments(
      chunks, 
      embeddings, 
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "notebooklm_collection", // Name of our database "folder"
      }
    );

    console.log(`Successfully stored ${chunks.length} chunks into Qdrant!`);
    
    // We return the vectorStore in case we need it immediately
    return vectorStore;
  } catch (error) {
    console.error("Error storing vectors in Qdrant:", error);
    throw error;
  }
};
