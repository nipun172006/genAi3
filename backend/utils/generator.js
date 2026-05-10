import { ChatGroq } from "@langchain/groq";

/**
 * Sends the user's question and the retrieved PDF chunks to the Groq LLM
 * to generate a grounded answer.
 * 
 * @param {string} question - The user's original question.
 * @param {Array} contextChunks - The top 6 chunks retrieved from Qdrant.
 * @returns {Promise<string>} The AI's response.
 */
export const generateAnswer = async (question, contextChunks) => {
  try {
    // 1. Initialize the Groq LLM
    // llama-3.3-70b-versatile is Groq's most powerful free model — much better quality.
    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // slight warmth for natural language without hallucination
      maxTokens: 1024,  // allow longer, more thorough answers
    });

    // 2. Format the context
    const contextString = contextChunks
      .map((chunk, i) => `[Excerpt ${i + 1}]:\n${chunk.pageContent}`)
      .join("\n\n");

    // 3. Create the System Prompt — structured, rich, grounded
    const systemPrompt = `You are an expert AI study assistant. Your role is to help students understand their course material deeply and clearly.

You are given excerpts from the student's uploaded documents. Use ONLY these excerpts to answer the question.

<context>
${contextString}
</context>

Guidelines for your answer:
1. Answer ONLY using the provided context above. Do not use outside knowledge.
2. Give a clear, well-structured answer. Use bullet points or numbered lists when helpful.
3. If a concept has multiple parts, explain each part clearly.
4. Keep the answer thorough but easy to understand — like a knowledgeable tutor explaining to a student.
5. If the answer is not found in the context, respond with exactly: "I could not find this in the uploaded document."

Do NOT mention "excerpts", "context", or "the document says" — just answer naturally and helpfully.`;

    // 4. Send the prompt to the LLM
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ]);

    return response.content;
  } catch (error) {
    console.error("Error generating answer from Groq:", error);
    throw error;
  }
};
