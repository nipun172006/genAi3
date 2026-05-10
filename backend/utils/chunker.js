import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Takes an array of LangChain Documents and splits them into smaller chunks.
 * 
 * @param {Array} docs - Array of Documents returned by the PDFLoader.
 * @returns {Promise<Array>} An array of chunked Documents.
 */
export const chunkDocuments = async (docs) => {
  try {
    console.log("Starting chunking process...");

    // 1. Initialize the text splitter with specific rules
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // 2. Split the full documents into smaller chunks
    const chunks = await textSplitter.splitDocuments(docs);

    console.log(`Successfully split the document into ${chunks.length} chunks.`);
    
    // 3. Print a sample chunk to the console
    if (chunks.length > 0) {
      console.log("\n--- Sample Chunk (Chunk 1) ---");
      console.log(chunks[0].pageContent);
      console.log("------------------------------\n");
    }

    return chunks;
  } catch (error) {
    console.error("Error chunking the documents:", error);
    throw error;
  }
};
