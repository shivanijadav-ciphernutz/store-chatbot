import express from 'express';  
const router = express.Router();
import { authenticateToken } from '../auth.js';
import { getLLMWithTools, getChatMessageHistory, mapHistoryMessagesToChat } from '../llm.js';
import { databaseTools } from '../tools.js';
import { structuredLlm, systemMessage } from '../llm.js';

router.post('/', authenticateToken, async (req, res) => {
    try {
      const { query, sessionId: sessionIdFromBody } = req.body;
      const user = req.user;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Query is required' 
        });
      }
  
      const sessionId = sessionIdFromBody || user.userId; // default to per-user session
      const chatHistory = await getChatMessageHistory(sessionId);
      const prior = await chatHistory.getMessages();
      const priorAsChat = mapHistoryMessagesToChat(prior);
  
      let systemMessageContent = systemMessage(user.role);
      const llmWithTools = await getLLMWithTools(user.role);
      // Save user message before invocation for consistency in transcripts
      await chatHistory.addUserMessage(query);
      // Get LLM response with tool calls, including prior history
      const response = await llmWithTools.invoke([
        { role: "system", content: systemMessageContent },
        ...priorAsChat,
        { role: "user", content: query }
      ]);
  
      let toolResults = [];
      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          console.log(`🧩 Tool selected: ${toolCall.name}`);
          console.log(`🔧 Args:`, toolCall.args);
  
          // Find the tool by name
          let userTools = await databaseTools(user.role);
          const tool = userTools.find(t => t.name === toolCall.name);
          if (!tool) throw new Error(`Tool ${toolCall.name} not found`);
  
          // Directly run the tool function (LangChain's `tool` wrapper has `.invoke()`)
          const result = await tool.invoke(toolCall.args);
  
          toolResults.push({
            tool: toolCall.name,
            args: toolCall.args,
            result
          });
        }
      }
  
      // Step 3️⃣ Summarize or return results
      let finalResponse;
        const summaryPrompt = `
        Summarize the following tool execution results for the user clearly:
        ${JSON.stringify(toolResults, null, 2)}
        `;
        const summary = await structuredLlm.invoke([
          { role: "system", content: "You are a summarizer." },
          { role: "user", content: summaryPrompt }
        ]);
  
        finalResponse = summary;
      finalResponse.dbcall = toolResults.length > 0;
  
      // Persist the assistant's response into history
      const assistantText = typeof finalResponse === 'string' ? finalResponse : (finalResponse?.summary || '');
      await chatHistory.addAIMessage(assistantText);
  
      res.json({
        success: true,
        query: query,
        response: finalResponse,
        sessionId,
        timestamp: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('Error processing query:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing query',
        error: error.message
      });
    }
  });

export default router;