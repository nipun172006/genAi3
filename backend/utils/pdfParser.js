import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

/**
 * Parses a PDF file and extracts its text content using LangChain's PDFLoader.
 * 
 * @param {string} filePath - The absolute or relative path to the PDF file.
 * @returns {Promise<Array>} An array of Document objects containing the text and metadata.
 */
export const parsePDF = async (filePath) => {
  try {
    console.log(`Starting to parse PDF: ${filePath}`);
    
    // 1. Initialize the PDFLoader with the path to the file
    const loader = new PDFLoader(filePath);

    // 2. Await the loader to read the file and extract text
    // The load() method reads the PDF and returns an array of "Documents".
    // Usually, each Document in the array represents one page of the PDF.
    const docs = await loader.load();

    console.log(`Successfully extracted ${docs.length} pages from the PDF.`);
    
    // 3. Print the extracted text to the console (as requested)
    // We will just print the first page's text to keep the console clean,
    // but we return all pages.
    if (docs.length > 0) {
        console.log("--- Extracted Text (Page 1 preview) ---");
        console.log(docs[0].pageContent.substring(0, 500) + "..."); // Print first 500 characters
        console.log("---------------------------------------");
    }

    return docs;
  } catch (error) {
    console.error("Error parsing the PDF:", error);
    throw error;
  }
};
