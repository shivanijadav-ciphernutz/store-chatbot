import express from 'express';  
const router = express.Router();
import { authenticateToken } from '../auth.js';
import { getLLMWithTools, getChatMessageHistory, mapHistoryMessagesToChat } from '../llm.js';
import { databaseTools } from '../tools.js';
import { structuredLlm, systemMessage } from '../llm.js';
import dbOps from '../db.js';

// GET endpoint to fetch chat history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { sessionId: sessionIdFromQuery } = req.query;
    const sessionId = sessionIdFromQuery || user.userId;
    
    const chatHistory = await getChatMessageHistory(sessionId);
    const prior = await chatHistory.getMessages();
    const priorAsChat = mapHistoryMessagesToChat(prior);
    
    // Convert to frontend format and detect HTML content
    const messages = priorAsChat.map((msg, index) => ({
      id: `history-${index}-${Date.now()}`,
      role: msg.role,
      content: msg.content,
      // Detect HTML content (if content contains HTML tags)
      isHtml: typeof msg.content === 'string' && /<[^>]+>/.test(msg.content)
    }));
    
    res.json({
      success: true,
      messages,
      sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
});

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
  
      const sessionId = sessionIdFromBody || user.userId;
      const chatHistory = await getChatMessageHistory(sessionId);
      const prior = await chatHistory.getMessages();
      const priorAsChat = mapHistoryMessagesToChat(prior);
  
      let systemMessageContent = systemMessage(user);
      const llmWithTools = await getLLMWithTools(user);
      await chatHistory.addUserMessage(query);
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
  
          let userTools = await databaseTools(user);
          const tool = userTools.find(t => t.name === toolCall.name);
          if (!tool) throw new Error(`Tool ${toolCall.name} not found`);
  
          const result = await tool.invoke(toolCall.args);
  
          toolResults.push({
            tool: toolCall.name,
            args: toolCall.args,
            result
          });
        }
      }
  
      let finalResponse;
      if (toolResults.length > 0) { 
        const summaryPrompt = `
        Summarize the following tool execution results for the user clearly:
        ${JSON.stringify(toolResults, null, 2)}
        `;
        const summary = await structuredLlm.invoke([
          { role: "system", content: "You are a summarizer." },
          { role: "user", content: summaryPrompt }
        ]);
  
        finalResponse = summary;
      } else {
        finalResponse = { data: response.content };
      }
      finalResponse.dbcall = toolResults.length > 0;
    
      finalResponse.summary = !finalResponse.dbcall ? finalResponse.data : finalResponse.summary;
      // Store HTML data in history when available, otherwise store summary/text
      const assistantText = typeof finalResponse === 'string' 
        ? finalResponse 
        : (finalResponse?.data && finalResponse.dbcall ? finalResponse.data : (finalResponse?.summary || finalResponse?.data || ''));
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

router.post('/clear', authenticateToken, async (req, res) => {
  try {
    const { sessionId: sessionIdFromBody } = req.body || {};
    const user = req.user;
    const sessionId = sessionIdFromBody || user.userId;
    const history = await getChatMessageHistory(sessionId);
    if (typeof history.clear === 'function') {
      await history.clear();
    } else {
      const collection = dbOps.getCollection('memory');
      await collection.deleteMany({ sessionId });
    }
    res.json({ success: true, sessionId, message: 'Chat session cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear chat session', error: error.message });
  }
});

export default router;