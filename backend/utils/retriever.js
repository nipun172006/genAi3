import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";

/**
 * Converts a user's question into an embedding and retrieves the top 3 most 
 * relevant chunks from the Qdrant database.
 * 
 * @param {string} question - The user's question.
 * @returns {Promise<Array>} An array of the top 3 matching Document chunks.
 */
export const retrieveRelevantChunks = async (question) => {
  try {
    console.log(`\n--- Starting Retrieval Process ---`);
    console.log(`User Question: "${question}"`);

    // 1. Initialize the same Embedding Model we used for storage
    // We MUST use the exact same model to turn the question into numbers
    // so it plots on the exact same "number map".
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY, 
      model: "sentence-transformers/all-MiniLM-L6-v2", 
    });

    // 2. Connect to our existing Qdrant collection
    // Instead of 'fromDocuments' (which creates data), we use 'fromExistingCollection'
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "notebooklm_collection",
      }
    );

    // 3. Perform Similarity Search
    // We ask Qdrant to find the 6 chunks (k: 6) that are closest to our question's vector.
    const topChunks = await vectorStore.similaritySearch(question, 6);

    console.log(`\nFound ${topChunks.length} relevant chunks!`);
    
    // 4. Print the retrieved chunks to the console for learning
    topChunks.forEach((chunk, index) => {
      console.log(`\n--- Result ${index + 1} ---`);
      console.log(chunk.pageContent);
    });
    console.log(`\n----------------------------------`);

    return topChunks;
  } catch (error) {
    console.error("Error during retrieval:", error);
    throw error;
  }
};
