// tools.js
import dbOps from './db.js';
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { collections, joins, llm } from './llm.js';
import { initializeSampleData } from './initData.js';
// Database tools for LLM tool calling
export const databaseTools = (userRole) => {
  if (userRole == "user") {
    return [
      // get user info
    tool(async (parameters) => {
      const userInfo = await dbOps.findDocuments("users", parameters.query);
        return {
          success: true,
          message: `Found ${userInfo.length} user(s)`,
          data: userInfo
        };
    }, {
      name: "get_user_info",
      description: "Get own information only from the users collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the user"),
      }),
    }),

    // get order info
    tool(async (parameters) => {
      const orderInfo = await dbOps.findDocuments("orders", parameters.query);
        return {
          success: true,
          message: `Found ${orderInfo.length} order(s)`,
          data: orderInfo
        };
    }, {
      name: "get_order_info",
      description: "Get information about an order from the orders collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the order"),
      }),
    }),
    
    // get product info
    tool(async (parameters) => {
      const productInfo = await dbOps.findDocuments("products", parameters.query);
        return {
          success: true,
          message: `Found ${productInfo.length} product(s)`,
          data: productInfo
        };
    }, {
      name: "get_product_info",
      description: "Get information about a product from the products collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the product"),
      }),
    }),

    // get category info
    tool(async (parameters) => {
      const categoryInfo = await dbOps.findDocuments("categories", parameters.query);
        return {
          success: true,
          message: `Found ${categoryInfo.length} category(ies)`,
          data: categoryInfo
        };
    }, {
      name: "get_category_info",
      description: "Get information about a category from the categories collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the category"),
      }),
    }),

    // find users
    tool(async (parameters) => {
      const users = await dbOps.findDocuments("users", parameters.query);
        return {
          success: true,
          message: `Found ${users.length} user(s)`,
          data: users
        };
    }, {
      name: "find_users",
      description: "Find users in the users collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the user or users"),
        limit: z.number().optional().describe("Maximum number of users to return"),
      }),
    }),

    // find orders
    tool(async (parameters) => {
      const orders = await dbOps.findDocuments("orders", parameters.query);
        return {
          success: true,
          message: `Found ${orders.length} order(s)`,
          data: orders
        };
    }, {
      name: "find_orders",
      description: "Find orders in the orders collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the order or orders"),
        limit: z.number().optional().describe("Maximum number of orders to return"),
      }),
    }),

    // find categories
    tool(async (parameters) => {
      const categories = await dbOps.findDocuments("categories", parameters.query);
        return {
          success: true,
          message: `Found ${categories.length} category(ies)`,
          data: categories
        };
    }, {
      name: "find_categories",
      description: "Find categories in the categories collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the category or categories"),
        limit: z.number().optional().describe("Maximum number of categories to return"),
      }),
    }),

    // find products
    tool(async (parameters) => {
      const products = await dbOps.findDocuments("products", parameters.query);
        return {
          success: true,
          message: `Found ${products.length} product(s)`,
          data: products
        };
    }, {
      name: "find_products",
      description: "Find products in the products collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the product or products"),
        limit: z.number().optional().describe("Maximum number of products to return"),
      }),
    })]
  } else {

    return [
    // insert category
    tool(async (parameters) => {
      const categoryDoc = {
        name: parameters.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const categoryResult = await dbOps.insertDocument("categories", categoryDoc);
      return {
        success: true,
        message: `Category "${parameters.name}" added successfully with ID: ${categoryResult.insertedId}`,
        data: categoryResult
      };
    },
    {
      name: "insert_category",
      description: "Insert a new category into the categories collection",
      schema: z.object({
        name: z.string().describe("Category name"),
      }),
    }),
        
    // insert product
    tool(async (parameters) => {
      const productDoc = {
        name: parameters.name,
        price: parameters.price,
        category_id: parameters.category_id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const productResult = await dbOps.insertDocument("products", productDoc);
      return {
        success: true,
        message: `Product "${parameters.name}" added successfully with ID: ${productResult.insertedId}`,
        data: productResult
      };
    }, {
      name: "insert_product",
      description: "Insert a new product into the products collection",
      schema: z.object({
        name: z.string().describe("Product name"),
        price: z.number().describe("Product price in rupees"),
        category_id: z.string().describe("ID of the category the product belongs to. \
          If the user provides a category name instead of an ID, first fetch the category document from the 'categories' collection by matching its 'name' field, then use its _id as the category_id. \
          If the user already provides a valid category_id, use it directly without lookup."),
      }),
    }),
  
    // insert order
    tool(
      async (parameters) => {
        const orderDoc = {
          user_id: parameters.user_id,
          product_ids: parameters.product_ids,
          total_price: parameters.total_price,
          order_status: parameters.order_status || "pending",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const orderResult = await dbOps.insertDocument("orders", orderDoc);
        return {
          success: true,
          message: `Order added successfully with ID: ${orderResult.insertedId}`,
          data: orderResult
        };
      },
      {
      name: "insert_order",
      description: "Insert a new order into the orders collection",
      schema: z.object({
        user_id: z.string().describe("ID of the user the order belongs to. \
            If the user provides a user name instead of an ID, first fetch the user document from the 'users' collection by matching its 'name' field, then use its _id as the user_id. \
            If the user already provides a valid user_id, use it directly without lookup."),
        product_ids: z.array(z.string()).describe("Array of product IDs the order contains. \
            If the user provides a product name instead of an ID, first fetch the product document from the 'products' collection by matching its 'name' field, then use its _id as the product_id. \
            If the user already provides a valid product_ids, use it directly without lookup."),
        total_price: z.number().describe("Total price of the order in rupees"),
        order_status: z.string().describe("Status of the order (pending, completed, cancelled)"),
      }),
    }),
  
    // insert user
      tool(
        async (parameters) => {
          const { hashPassword } = await import('./auth.js');
          const hashedPassword = await hashPassword(parameters.password);
          const userDoc = {
            name: parameters.name,
            email: parameters.email,
            password: hashedPassword,
            role: parameters.role || "user",
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const userResult = await dbOps.insertDocument("users", userDoc);
          return {
            success: true,
            message: `User "${parameters.name}" added successfully with ID: ${userResult.insertedId}`,
            data: userResult
          };
        },
        {
        name: "insert_user",
        description: "Insert a new user into the users collection",
        schema: z.object({
          name: z.string().describe("User name"),
          email: z.string().describe("User email"),
          role: z.string().describe("Role of the user (admin, user). default is 'user'"),
          password: z.string().describe("Password of the user. should be hashed before storing in the database. use bcrypt to hash the password."),
        }),
      }),  
      
    // update product
      tool(async(parameters) => {
        let updateDoc;
          if (parameters.update && parameters.update.$set) {
            updateDoc = {
              $set: {
                ...parameters.update.$set,
                updatedAt: new Date()
              }
            };
          } else {
            updateDoc = {
              $set: {
                ...parameters.update,
                updatedAt: new Date()
              }
            };
          }
          
          const updateResult = await dbOps.updateDocuments(
            "products",
            parameters.query,
            updateDoc
          );
          
          return {
            success: true,
            message: `Updated ${updateResult.modifiedCount} products`,
            data: updateResult
          };
      },{
        name: "update_product",
        description: "Update products in the products collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify products to update"),
          update: z.record(z.any()).describe("MongoDB update object with fields to update"),
        }),
      }),
  
    // update category
      tool(async(parameters) => {
        let updateCategoryDoc;
          if (parameters.update && parameters.update.$set) {
            updateCategoryDoc = {
              $set: {
                ...parameters.update.$set,
                updatedAt: new Date()
              }
            };
          } else {
            updateCategoryDoc = {
              $set: {
                ...parameters.update,
                updatedAt: new Date()
              }
            };
          }
          
          const updateCategoryResult = await dbOps.updateDocuments(
            "categories",
            parameters.query,
            updateCategoryDoc
          );
          
          return {
            success: true,
            message: `Updated ${updateCategoryResult.modifiedCount} categories`,
            data: updateCategoryResult
          };
      }, {
        name: "update_category",
        description: "Update categories in the categories collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify categories to update"),
          update: z.record(z.any()).describe("MongoDB update object with fields to update"),
        }),
      }),
  
    // update order
      tool(async(parameters) => {
        let updateOrderDoc;
          if (parameters.update && parameters.update.$set) {
            updateOrderDoc = {
              $set: {
                ...parameters.update.$set,
                updatedAt: new Date()
              }
            };
          } else {
            updateOrderDoc = {
              $set: {
                ...parameters.update,
                updatedAt: new Date()
              }
            };
          }
          
          const updateOrderResult = await dbOps.updateDocuments(
            "orders",
            parameters.query,
            updateOrderDoc
          );
          
          return {
            success: true,
            message: `Updated ${updateOrderResult.modifiedCount} orders`,
            data: updateOrderResult
          };
      }, 
      {
        name: "update_order",
        description: "Update an order in the orders collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the order to update"),
          update: z.record(z.any()).describe("MongoDB update object with fields to update"),
        }),
      }),
  
    // update user
      tool(async(parameters) => {
        const { hashPassword } = await import('./auth.js');
        let updateUserDoc;
        
        // Check if password is being updated
        if (parameters.update && parameters.update.$set) {
          const updateFields = { ...parameters.update.$set };
          if (updateFields.password) {
            updateFields.password = await hashPassword(updateFields.password);
          }
          updateUserDoc = {
            $set: {
              ...updateFields,
              updatedAt: new Date()
            }
          };
        } else {
          const updateFields = { ...parameters.update };
          if (updateFields.password) {
            updateFields.password = await hashPassword(updateFields.password);
          }
          updateUserDoc = {
            $set: {
              ...updateFields,
              updatedAt: new Date()
            }
          };
        }
          
          const updateUserResult = await dbOps.updateDocuments(
            "users",
            parameters.query,
            updateUserDoc
          );
          
          return {
            success: true,
            message: `Updated ${updateUserResult.modifiedCount} users`,
            data: updateUserResult
          };
      }, {
        name: "update_user",
        description: "Update users in the users collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify users to update"),
          update: z.record(z.any()).describe("MongoDB update object with fields to update"),
        }),
      }),
  
    // delete order
      tool(async (parameters) => {
        const deleteOrderResult = await dbOps.deleteDocuments("orders", parameters.query);
          return {
            success: true,
            message: `Deleted ${deleteOrderResult.deletedCount} orders`,
            data: deleteOrderResult
          };
      }, {
        name: "delete_order",
        description: "Delete an order from the orders collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the order to delete"),
        }),
      }),
  
    // delete user
      tool(async (parameters) => {
        const deleteUserResult = await dbOps.deleteDocuments("users", parameters.query);
          return {
            success: true,
            message: `Deleted ${deleteUserResult.deletedCount} users`,
            data: deleteUserResult
          };
      }, {
        name: "delete_user",
        description: "Delete a user from the users collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the user to delete"),
        }),
      }),
  
    // delete category
      tool(async (parameters) => {
        const deleteCategoryResult = await dbOps.deleteDocuments("categories", parameters.query);
          return {
            success: true,
            message: `Deleted ${deleteCategoryResult.deletedCount} categories`,
            data: deleteCategoryResult
          };
      }, {
        name: "delete_category",
        description: "Delete a category from the categories collection and all products under it",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the category to delete"),
        }),
      }),
  
    // delete product
      tool(async (parameters) => {
        const deleteProductResult = await dbOps.deleteDocuments("products", parameters.query);
          return {
            success: true,
            message: `Deleted ${deleteProductResult.deletedCount} products`,
            data: deleteProductResult
          };
      }, {
        name: "delete_product",
        description: "Delete a product from the products collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the product to delete"),
        }),
      }),
  
    // get user info
      tool(async (parameters) => {
        const userInfo = await dbOps.findDocuments("users", parameters.query);
          return {
            success: true,
            message: `Found ${userInfo.length} user(s)`,
            data: userInfo
          };
      }, {
        name: "get_user_info",
        description: "Get information about a user from the users collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the user"),
        }),
      }),
  
      // get order info
      tool(async (parameters) => {
        const orderInfo = await dbOps.findDocuments("orders", parameters.query);
          return {
            success: true,
            message: `Found ${orderInfo.length} order(s)`,
            data: orderInfo
          };
      }, {
        name: "get_order_info",
        description: "Get information about an order from the orders collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the order"),
        }),
      }),
      
      // get product info
      tool(async (parameters) => {
        const productInfo = await dbOps.findDocuments("products", parameters.query);
          return {
            success: true,
            message: `Found ${productInfo.length} product(s)`,
            data: productInfo
          };
      }, {
        name: "get_product_info",
        description: "Get information about a product from the products collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the product"),
        }),
      }),
  
      // get category info
      tool(async (parameters) => {
        const categoryInfo = await dbOps.findDocuments("categories", parameters.query);
          return {
            success: true,
            message: `Found ${categoryInfo.length} category(ies)`,
            data: categoryInfo
          };
      }, {
        name: "get_category_info",
        description: "Get information about a category from the categories collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the category"),
        }),
      }),
  
      // find users
      tool(async (parameters) => {
        const users = await dbOps.findDocuments("users", parameters.query);
          return {
            success: true,
            message: `Found ${users.length} user(s)`,
            data: users
          };
      }, {
        name: "find_users",
        description: "Find users in the users collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the user or users"),
          limit: z.number().optional().describe("Maximum number of users to return"),
        }),
      }),
  
      // find orders
      tool(async (parameters) => {
        const orders = await dbOps.findDocuments("orders", parameters.query);
          return {
            success: true,
            message: `Found ${orders.length} order(s)`,
            data: orders
          };
      }, {
        name: "find_orders",
        description: "Find orders in the orders collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the order or orders"),
          limit: z.number().optional().describe("Maximum number of orders to return"),
        }),
      }),
  
      // find categories
      tool(async (parameters) => {
        const categories = await dbOps.findDocuments("categories", parameters.query);
          return {
            success: true,
            message: `Found ${categories.length} category(ies)`,
            data: categories
          };
      }, {
        name: "find_categories",
        description: "Find categories in the categories collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the category or categories"),
          limit: z.number().optional().describe("Maximum number of categories to return"),
        }),
      }),
  
      // find products
      tool(async (parameters) => {
        const products = await dbOps.findDocuments("products", parameters.query);
          return {
            success: true,
            message: `Found ${products.length} product(s)`,
            data: products
          };
      }, {
        name: "find_products",
        description: "Find products in the products collection",
        schema: z.object({
          query: z.record(z.any()).describe("MongoDB query object to identify the product or products"),
          limit: z.number().optional().describe("Maximum number of products to return"),
        }),
      }),
  
      // get collection info
      tool(async () => {
        const collections = await dbOps.getCollectionNames();
          return {
            success: true,
            message: `Found ${collections.length} collections`,
            data: collections.map(col => col.name)
          };
      }, {
        name: "get_collection_info",
        description: "Get information about available collections and their schemas",
        schema: z.object({
        }),
      }),
  
      tool(async () => {
        await initializeSampleData();
        return {
          success: true,
          message: "Sample data initialized successfully",
          data: "Sample data initialized successfully"
        };
      }, {
        name: "sample_data",
        description: "Initialize sample data in the database for testing purposes",
        schema: z.object({}),
      }),
  
      tool(async (parameters) => {
        try {
          // Generate MongoDB query using LLM
          const prompt = `
            You are an expert MongoDB query generator.
            Convert the following natural language request into a valid MongoDB find query 
            with both "filter" and "projection" objects as JSON.
  
            Return ONLY a JSON object like this:
            {
              "filter": { ... },
              "projection": { ... }
            }
  
            Rules:
            - Use MongoDB operators like $eq, $gt, $lt, $regex, $exists, etc.
            - If user says "without timestamp columns", or "exclude createdAt and updatedAt",
              then use projection: { createdAt: 0, updatedAt: 0 }.
            - If user says "only name and price", use projection: { name: 1, price: 1, _id: 0 }.
            - If user says "all products" or doesn't specify filter, use empty filter {}.
            - Always return valid JSON (no text or code fences).
  
            Example:
            - "Find all products" → { "filter": {}, "projection": {} }
            - "Find products without timestamp columns" → { "filter": {}, "projection": { "createdAt": 0, "updatedAt": 0 } }
            - "Show only name and price of all products" → { "filter": {}, "projection": { "name": 1, "price": 1, "_id": 0 } }
  
            Request: "${parameters.text}"`;
  
          const queryResponse = await llm.invoke([
            { role: "system", content: "You are a MongoDB query generator that returns only valid JSON query objects. { filter: { ... }, projection: { ... } }" },
            { role: "user", content: prompt }
          ]);
  
          // Parse generated query string safely
          let generatedQuery;
          try {
            generatedQuery = JSON.parse(queryResponse.content.replace(/```json|```/g, "").trim());
          } catch (e) {
            console.error("❌ Error parsing query:", queryResponse.content);
            return {
              success: false,
              message: "Failed to parse generated query. Raw response: " + queryResponse.content
            };
          }
  
          // Execute the query automatically
          const results = await dbOps.findDocuments(parameters.collection || "products", generatedQuery.filter, generatedQuery.projection);
  
          return {
            success: true,
            message: `Query generated and executed successfully on ${parameters.collection || "products"} collection.`,
            query: generatedQuery,
            count: results.length,
            data: results
          };
  
        } catch (error) {
          console.error("⚠️ Error in generate_query tool:", error);
          return {
            success: false,
            message: `Error generating or running query: ${error.message}`
          };
        }
      }, {
        name: "generate_query",
        description: "Generate and execute a MongoDB query from natural language directly",
        schema: z.object({
          text: z.string().describe("The natural language query request"),
          collection: z.string().optional().describe("Collection name to run query on (default: products)")
        }),
      })
    ];
  }
}