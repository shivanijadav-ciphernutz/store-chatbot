// app.js
import express from 'express';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import cors from 'cors';
import { llm, getLLMWithTools, structuredLlm, systemMessage, getChatMessageHistory, mapHistoryMessagesToChat } from './llm.js';
// import { executeTool } from './tools.js';
import dbOps from './db.js';
import 'dotenv/config';
import { databaseTools } from './tools.js';
import { signup, login, authenticateToken } from './auth.js';
import { ObjectId } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const result = await signup(name, email, password);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await login(email, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Token verification endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    // If authenticateToken middleware passes, token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      user: req.user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Protected API endpoint to process natural language database operations
app.post('/api/query', authenticateToken, async (req, res) => {
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

    // Execute any tool calls
    // let toolResults = [];
    // if (response.tool_calls && response.tool_calls.length > 0) {
    //   for (const toolCall of response.tool_calls) {
    //     const result = await executeTool(toolCall.name, toolCall.args);
    //     toolResults.push({
    //       tool: toolCall.name,
    //       result: result
    //     });
    //   }
    // } else {
    //   res.json({
    //     success: true,
    //     query: query,
    //     response:{
    //       summary: "No database calls were made",
    //       data: response.content
    //     },
    //     toolResults: [],
    //     timestamp: new Date().toISOString()
    //   });
    // }

    // Get final response from LLM after tool execution
    // let finalResponse = response.content;
    // if (toolResults.length > 0) {
    //   finalResponse = await structuredLlm.invoke(`The result should be based on the output of tool calls:\n${JSON.stringify(toolResults, null, 2)}`);
    // }

    // let finalResponse;
    // if (response.tool_calls && response.tool_calls.length > 0) {
    //   finalResponse = await structuredLlm.invoke(`The result should be based on the output of tool calls:\n${JSON.stringify(response.content, null, 2)}`);
    // } else {
    //   finalResponse = {
    //     summary: "No database calls were made",
    //     data: response.content
    //   };
    // }

    let toolResults = [];

    // Step 2️⃣ If tools are requested, execute directly here
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
    // if (toolResults.length > 0) {
      const summaryPrompt = `
      Summarize the following tool execution results for the user clearly:
      ${JSON.stringify(toolResults, null, 2)}
      `;
      const summary = await structuredLlm.invoke([
        { role: "system", content: "You are a summarizer." },
        { role: "user", content: summaryPrompt }
      ]);

      finalResponse = summary;
    // } else {
    //   finalResponse = {
    //     summary: "No database calls were made",
    //     data: response.content
    //   };
    // }
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

// API endpoint to get products (paginated)
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const { items, total } = await dbOps.findDocumentsPaginated('products', {
      query: {},
      projection: { password: 0 },
      sort: { [sortField]: sortOrder },
      skip,
      limit
    });

    res.json({
      success: true,
      data: items,
      page,
      pageSize: limit,
      total,
      hasMore: skip + items.length < total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// API endpoint to get all categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await dbOps.findDocuments('categories', {}, { password: 0 });
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// API endpoint to get user's orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await dbOps.findDocuments('orders', { user_id: userId }, { password: 0 });
    
    // Populate product details
    const ordersWithProducts = await Promise.all(orders.map(async (order) => {
      if (!order.product_ids || order.product_ids.length === 0) {
        return {
          ...order,
          products: []
        };
      }
      
      const products = await Promise.all(
        order.product_ids.map(async (productId) => {
          try {
            const productIdObj = typeof productId === 'string' ? new ObjectId(productId) : productId;
            const product = await dbOps.findDocuments('products', { _id: productIdObj }, { password: 0 });
            return product[0] || null;
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
            return null;
          }
        })
      );
      return {
        ...order,
        products: products.filter(p => p !== null)
      };
    }));

    res.json({
      success: true,
      data: ordersWithProducts,
      count: ordersWithProducts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// API endpoint to create an order
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { product_ids, total_price } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (total_price === undefined || total_price === null) {
      return res.status(400).json({
        success: false,
        message: 'Total price is required'
      });
    }

    const orderDoc = {
      user_id: userId,
      product_ids: product_ids,
      total_price: total_price,
      order_status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await dbOps.insertDocument('orders', orderDoc);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        _id: result.insertedId.toString(),
        ...orderDoc
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// API endpoint to get collection information
// app.get('/api/collections', async (req, res) => {
//   try {
//     const collections = await dbOps.getCollectionNames();
//     res.json({
//       success: true,
//       data: collections.map(col => col.name),
//       count: collections.length
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching collections',
//       error: error.message
//     });
//   }
// });

// Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'API is running',
//     timestamp: new Date().toISOString()
//   });
// });

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/auth/signup - Sign up a new user`);
  console.log(`  POST /api/auth/login - Login user`);
  console.log(`  GET  /api/auth/verify - Verify JWT token (protected)`);
  console.log(`  POST /api/query - Process natural language database operations (protected)`);
  console.log(`  GET  /api/products - Get all products (protected)`);
  console.log(`  GET  /api/categories - Get all categories (protected)`);
  console.log(`  GET  /api/orders - Get user's orders (protected)`);
  console.log(`  POST /api/orders - Create a new order (protected)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await dbOps.close();
  process.exit(0);
});
