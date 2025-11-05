import express from 'express';  
const router = express.Router();
import { authenticateToken } from '../auth.js';
import { getLLMWithTools, getChatMessageHistory, mapHistoryMessagesToChat } from '../llm.js';
import { databaseTools } from '../tools.js';
import { structuredLlm, systemMessage } from '../llm.js';
import dbOps from '../db.js';
import { createAgent } from "langchain"
import { llm } from '../llm.js';

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
  
      let systemMessageContent = await systemMessage(user);
      const tools = await databaseTools(user);
      await chatHistory.addUserMessage(query);

      const agent = createAgent({
        model: llm,
        tools,
        systemMessage: systemMessageContent,
      });
      const response = await agent.invoke({
        messages: [...priorAsChat, { role: "user", content: query }],
      });

      const lastMessage = response.messages?.at(-2);

        const summaryPrompt = `
        Summarize the following tool execution results for the user clearly:
        ${lastMessage?.content ?? 'No message from the agent'}
        `;
      const summary = await structuredLlm.invoke([
        { role: "system", content: `You are a summarizer. based on below message, summarize the result for the user clearly and inform about next steps if any: ${systemMessageContent}` },
        { role: "user", content: summaryPrompt }
      ]);

      // Format summary as JSON string to enssummarysistent storage and retrieval
      const summaryString = JSON.stringify(summary);
      await chatHistory.addAIMessage(summaryString);
  
      res.json({
        success: true,
        query: query,
        response: summary,
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