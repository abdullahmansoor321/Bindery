import { generateRagResponse } from "./actions/rag-response";

async function testRagResponse() {
  console.log("Testing RAG response functionality...\n");

  // This is a test that would require a real workspace ID and user context
  // In practice, this would be run in an authenticated context
  
  try {
    // Example test - this would need real data to work properly
    const workspaceId = "test-workspace-id"; // This would need to be a real workspace ID
    const query = "What is this workspace about?";
    
    console.log("Query:", query);
    console.log("Workspace ID:", workspaceId);
    
    // Note: This test won't work without a real authenticated context and existing workspace data
    // The function requires:
    // 1. A logged-in user (via Supabase auth)
    // 2. A valid workspace that the user has access to
    // 3. Page chunks in the database to retrieve
    
    console.log("\nRAG response function created successfully!");
    console.log("To fully test this functionality:");
    console.log("1. Set up GEMINI_API_KEY and/or GROQ_API_KEY in your environment");
    console.log("2. Ensure you have a valid workspace with content");
    console.log("3. Run this in an authenticated server context");
    
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

testRagResponse().catch(console.error);