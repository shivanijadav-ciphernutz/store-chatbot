// llm.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import 'dotenv/config';
import { databaseTools } from './tools.js';
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import dbOps from "./db.js";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});


// Configure LLM with tools
// const llmWithTools = llm.bindTools(databaseTools);
// const llmWithTools = (userRole) => llm.bindTools(await databaseTools(userRole));

const getLLMWithTools = async (userRole) => {
  const userTools = await databaseTools(userRole);
  const llmWithTools = llm.bindTools(userTools);
  return llmWithTools;
}

const collections = `- Available collections and their schemas:
          - products: { name: string, price: number (optional) (default: 0), category_id: string (optional) (default: null), createdAt: Date, updatedAt: Date }
          - categories: { name: string, createdAt: Date, updatedAt: Date }
          - orders: { user_id: string, product_ids: string[], total_price: number, order_status: string (default: "pending"), createdAt: Date, updatedAt: Date }
          - users: { name: string, email: string, role: string (default: "user"), password: string, createdAt: Date, updatedAt: Date }`

const joins = `- Joins:
          - products and categories: product.category_id = category.id
          - products and orders: product.id = order.product_ids
          - users and orders: user.id = order.user_id`

// System message for the LLM
const systemMessage = (userRole) => {
  return `You are a database assistant. You can help users perform database operations using natural language on mongodb database.

        ${collections}

        ${joins}

        -instructions for specific collections:
          - products:
            - if category name or id is not provided, it will be null.
            - if category name is provided while adding or updating a product, check if the category exists in the categories collection and if not, add it first (inform about it in the summary). then use the id of the added category.
          - categories:
          - orders:
            - if user name or id is not provided, ask for it.
            - if user name is provided while adding or updating an order, check if the user exists in the users collection and if not, add it first (inform about it in the summary). then use the id of the added user.
            - if product name or id is not provided, it will be null.
            - if product name is provided while adding or updating an order, check if the product exists in the products collection and if not, then inform about it in the summary and ask the user to add the product first. then use the id of the added product.
          - users:
            - if role is not provided, it will be "user".
            - Role can be "admin" or "user".
            - exclude the password from the output when asked for user info.
            - password should be hashed before storing in the database.

        - When users ask to:
          - Add/insert product or multiple products: Use insert_product tool
          - Add/insert category or multiple categories: Use insert_category tool
          - Add/insert order or multiple orders: Use insert_order tool
          - Add/insert users: Use insert_user tool
          - Find/search product or multiple products: Use find_products tool
          - Find/search categories: Use find_categories tool
          - Find/search user or multiple users: Use find_users tool
          - Find/search order or multiple orders: Use find_orders tool
          - Update products: Use update_product tool
          - Delete product or multiple products: Use delete_product tool
          - Update order or multiple orders: Use update_order tool
          - Delete orders: Use delete_order tool
          - Get user info or multiple users: Use get_user_info tool
          - Get order info or multiple orders: Use get_order_info tool
          - Get collection info or multiple collections: Use get_collection_info tool

        Multi-step indicators: "and then", "after that", "next", "then add", "then create", etc.
        breakdown the tasks or sentences into smaller steps and execute them one by one.
        If bulk operations are required, use tool multiple times with appropriate parameters.

        All the entities can be added in bulk by comma separated values, array format or just by "and" keyword.
        If user request is not served by any tool, use generate_query tool to generate a mongodb query to get the desired data.
        Return specified columns if asked, for that use generate_query tool to generate a mongodb query to get the desired data.
        For multi-step operations, break down the user's intented tasks and execute multiple tools in sequence. tool_calls should have series of tool calls in sequence.
        Always provide clear feedback about what was done.
        If the user query is not clear, ask for more information.
        If the user query is not related to the database, say "I'm sorry, I can only help with database operations."
        If requried fields are not provided, ask for them.
        If optional fields are not provided, use the default value.
        If user is asking for a complex query, use multiple collections and joins to get the desired data, design a mongodb query to get the desired data. use run_query tool to execute the query.

        Restrictions based on the logged in user's role:
          - The user must have to have below authority to perform this operation.

        ${userRole == "admin" ? 
          `- The user can perform all operations (insert, update, delete, find).` : 
          `- Allowed:
            - Find/search/view products, categories, and their own orders.
            - Place new orders (insert into orders collection).
            - Update their own user profile.
          - Not allowed:
            - Add/update/delete any products
            - Add/update/delete any categories
            - Add/update/delete any users.
            - Access or modify orders belonging to other users.
          - If user requests any restricted operation:
            - Reply strictly with: "I'm sorry, you are not authorized to perform this operation."
            - Do NOT attempt or suggest using any tool for such restricted operations.`
          }

          `;
      };

// Structured output for the LLM
  const structuredLlm = llm.withStructuredOutput({
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "summary of what was accomplished"
      },
      data: {
        type: "string",
        description:
          `output data in readable HTML with styling, css and formatting. 
          if output is a Single object → HTML card; 
          if output is a list of objects → HTML table. 
          Do not include _id.
          Timestamp should be in the format of YYYY-MM-DD HH:MM:SS`
      }
    },
    required: ["summary", "data"],
  });

export { llm, getLLMWithTools, structuredLlm, systemMessage, collections, joins };

// Chat memory helpers
export async function getChatMessageHistory(sessionId) {
  const collection = dbOps.getCollection("memory");
  return new MongoDBChatMessageHistory({ collection, sessionId });
}

export function mapHistoryMessagesToChat(historyMessages) {
  return historyMessages.map((msg) => {
    const type = typeof msg._getType === 'function' ? msg._getType() : msg.type;
    const role = type === 'human' ? 'user' : type === 'ai' ? 'assistant' : type || 'user';
    const content = Array.isArray(msg.content)
      ? msg.content.map((c) => (typeof c === 'string' ? c : c.text || '')).join('\n')
      : msg.content;
    return { role, content };
  });
}