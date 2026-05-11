import fs from "fs";
import { parse } from "csv-parse/sync";
import { Document } from "@langchain/core/documents";

/**
 * Parses a CSV file and converts each row into a LangChain Document.
 * Each row is converted to a "key: value" text block so the LLM can
 * understand it naturally, just like reading a paragraph.
 *
 * @param {string} filePath - Absolute path to the uploaded CSV file.
 * @returns {Promise<Document[]>} Array of LangChain Documents, one per row.
 */
export const parseCSV = async (filePath) => {
  console.log(`\nStarting to parse CSV: ${filePath}`);

  // 1. Read the raw file content from disk
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // 2. Parse the CSV into an array of objects
  // { columns: true } uses the first row as header keys
  // { skip_empty_lines: true } ignores blank lines
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Successfully parsed ${records.length} rows from the CSV.`);

  // 3. Convert each row object into a readable text string
  // Example: { Name: "Alice", Age: "30" } → "Name: Alice\nAge: 30"
  const documents = records.map((row, index) => {
    const textContent = Object.entries(row)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    return new Document({
      pageContent: textContent,
      metadata: {
        source: filePath,
        row: index + 1, // Track which row this came from
      },
    });
  });

  // Show a preview of the first row
  if (documents.length > 0) {
    console.log(`--- Row 1 Preview ---\n${documents[0].pageContent.slice(0, 300)}\n---------------------`);
  }

  return documents;
};
