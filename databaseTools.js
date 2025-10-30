// databaseTools.js
import dbOps from './db.js';
import { z } from "zod";

// Database tools for LLM tool calling
export const databaseTools = [
      {
        name: "insert_category",
        description: "Insert a new category into the categories collection",
        schema: z.object({
          name: z.string().describe("Category name"),
        }),
      },
      {
        name: "insert_product",
        description: "Insert a new product into the products collection",
        schema: z.object({
          name: z.string().describe("Product name"),
          price: z.number().describe("Product price in rupees"),
          category_id: z.string().describe("ID of the category the product belongs to. \
            If the user provides a category name instead of an ID, first fetch the category document from the 'categories' collection by matching its 'name' field, then use its _id as the category_id. \
            If the user already provides a valid category_id, use it directly without lookup."),
        }),
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
    },
    {
      name: "insert_user",
      description: "Insert a new user into the users collection",
      schema: z.object({
        name: z.string().describe("User name"),
        email: z.string().describe("User email"),
        role: z.string().describe("Role of the user (admin, user)"),
      }),
    },  
    {
      name: "update_product",
      description: "Update products in the products collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify products to update"),
        update: z.record(z.any()).describe("MongoDB update object with fields to update"),
      }),
    },
    {
      name: "update_category",
      description: "Update categories in the categories collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify categories to update"),
        update: z.record(z.any()).describe("MongoDB update object with fields to update"),
      }),
    },
    {
      name: "update_user",
      description: "Update users in the users collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify users to update"),
        update: z.record(z.any()).describe("MongoDB update object with fields to update"),
      }),
    },
    {
      name: "update_order",
      description: "Update an order in the orders collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the order to update"),
        update: z.record(z.any()).describe("MongoDB update object with fields to update"),
      }),
    },
    {
      name: "delete_order",
      description: "Delete an order from the orders collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the order to delete"),
      }),
    },
    {
      name: "delete_user",
      description: "Delete a user from the users collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the user to delete"),
      }),
    },
    {
      name: "delete_category",
      description: "Delete a category from the categories collection and all products under it",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the category to delete"),
      }),
    },
    {
      name: "delete_product",
      description: "Delete a product from the products collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the product to delete"),
      }),
    },
    {
      name: "get_user_info",
      description: "Get information about a user from the users collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the user"),
      }),
    },
    {
      name: "get_order_info",
      description: "Get information about an order from the orders collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the order"),
      }),
    },
    {
      name: "get_product_info",
      description: "Get information about a product from the products collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the product"),
      }),
    },
    {
      name: "get_category_info",
      description: "Get information about a category from the categories collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the category"),
      }),
    },
    {
      name: "find_users",
      description: "Find users in the users collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the user or users"),
        limit: z.number().optional().describe("Maximum number of users to return"),
      }),
    },
    {
      name: "find_orders",
      description: "Find orders in the orders collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the order or orders"),
        limit: z.number().optional().describe("Maximum number of orders to return"),
      }),
    },
    {
      name: "find_categories",
      description: "Find categories in the categories collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the category or categories"),
        limit: z.number().optional().describe("Maximum number of categories to return"),
      }),
    },
    {
      name: "find_products",
      description: "Find products in the products collection",
      schema: z.object({
        query: z.record(z.any()).describe("MongoDB query object to identify the product or products"),
        limit: z.number().optional().describe("Maximum number of products to return"),
      }),
    },
    {
      name: "get_collection_info",
      description: "Get information about available collections and their schemas",
      schema: z.object({
      }),
    },
    {
      name: "multi_step_operation",
      description: "Execute multiple database operations in sequence for multi-step queries",
      schema: z.object({
        operations: z.array(z.object({
          tool: z.string().describe("Name of the tool to execute"),
          parameters: z.record(z.any()).describe("Parameters for the tool")
        })).describe("Array of operations to execute in sequence")
      }),
    },
  ];

// Tool execution functions
export const executeTool = async (toolName, parameters) => {
  try {
    switch (toolName) {
      case "insert_product":
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

      case "insert_category":
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

      case "find_products":
        const products = await dbOps.findDocuments("products", parameters.query || {});
        const limitedProducts = parameters.limit ? products.slice(0, parameters.limit) : products;
        return {
          success: true,
          message: `Found ${limitedProducts.length} products`,
          data: limitedProducts
        };

      case "find_categories":
        const categories = await dbOps.findDocuments("categories", parameters.query || {});
        const limitedCategories = parameters.limit ? categories.slice(0, parameters.limit) : categories;
        return {
          success: true,
          message: `Found ${limitedCategories.length} categories`,
          data: limitedCategories
        };

      case "update_product":
        // Handle both $set and direct field updates
        let updateDoc;
        if (parameters.update && parameters.update.$set) {
          // If update already has $set, merge with updatedAt
          updateDoc = {
            $set: {
              ...parameters.update.$set,
              updatedAt: new Date()
            }
          };
        } else {
          // If update is direct fields, wrap in $set
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

      case "update_category":
        // Handle both $set and direct field updates
        let updateCategoryDoc;
        if (parameters.update && parameters.update.$set) {
          // If update already has $set, merge with updatedAt
          updateCategoryDoc = {
            $set: {
              ...parameters.update.$set,
              updatedAt: new Date()
            }
          };
        } else {
          // If update is direct fields, wrap in $set
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

      case "update_user":
        // Handle both $set and direct field updates
        let updateUserDoc;
        if (parameters.update && parameters.update.$set) {
          // If update already has $set, merge with updatedAt
          updateUserDoc = {
            $set: {
              ...parameters.update.$set,
              updatedAt: new Date()
            }
          };
        } else {
          // If update is direct fields, wrap in $set
          updateUserDoc = {
            $set: {
              ...parameters.update,
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

      case "update_order":
        // Handle both $set and direct field updates
        let updateOrderDoc;
        if (parameters.update && parameters.update.$set) {
          // If update already has $set, merge with updatedAt
          updateOrderDoc = {
            $set: {
              ...parameters.update.$set,
              updatedAt: new Date()
            }
          };
        } else {
          // If update is direct fields, wrap in $set
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

      case "insert_user":
        const userDoc = {
          name: parameters.name,
          email: parameters.email,
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

      case "insert_order":
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

      case "find_users":
        const users = await dbOps.findDocuments("users", parameters.query || {});
        const limitedUsers = parameters.limit ? users.slice(0, parameters.limit) : users;
        return {
          success: true,
          message: `Found ${limitedUsers.length} users`,
          data: limitedUsers
        };

      case "find_orders":
        const orders = await dbOps.findDocuments("orders", parameters.query || {});
        const limitedOrders = parameters.limit ? orders.slice(0, parameters.limit) : orders;
        return {
          success: true,
          message: `Found ${limitedOrders.length} orders`,
          data: limitedOrders
        };

      case "get_user_info":
        const userInfo = await dbOps.findDocuments("users", parameters.query || {});
        return {
          success: true,
          message: `Found ${userInfo.length} user(s)`,
          data: userInfo
        };

      case "get_order_info":
        const orderInfo = await dbOps.findDocuments("orders", parameters.query || {});
        return {
          success: true,
          message: `Found ${orderInfo.length} order(s)`,
          data: orderInfo
        };

      case "get_product_info":
        const productInfo = await dbOps.findDocuments("products", parameters.query || {});
        return {
          success: true,
          message: `Found ${productInfo.length} product(s)`,
          data: productInfo
        };

      case "get_category_info":
        const categoryInfo = await dbOps.findDocuments("categories", parameters.query || {});
        return {
          success: true,
          message: `Found ${categoryInfo.length} category(ies)`,
          data: categoryInfo
        };

      case "delete_order":
        const deleteOrderResult = await dbOps.deleteDocuments("orders", parameters.query);
        return {
          success: true,
          message: `Deleted ${deleteOrderResult.deletedCount} orders`,
          data: deleteOrderResult
        };

      case "delete_user":
        const deleteUserResult = await dbOps.deleteDocuments("users", parameters.query);
        return {
          success: true,
          message: `Deleted ${deleteUserResult.deletedCount} users`,
          data: deleteUserResult
        };

      case "delete_category":
        const deleteCategoryResult = await dbOps.deleteDocuments("categories", parameters.query);
        return {
          success: true,
          message: `Deleted ${deleteCategoryResult.deletedCount} categories`,
          data: deleteCategoryResult
        };

      case "multi_step_operation":
        const results = [];
        for (const operation of parameters.operations) {
          const result = await executeTool(operation.tool, operation.parameters);
          results.push({
            tool: operation.tool,
            result: result
          });
        }
        return {
          success: true,
          message: `Executed ${results.length} operations in sequence`,
          data: results
        };

      case "delete_product":
        const deleteResult = await dbOps.deleteDocuments("products", parameters.query);
        return {
          success: true,
          message: `Deleted ${deleteResult.deletedCount} products`,
          data: deleteResult
        };

      case "get_collection_info":
        const collections = await dbOps.getCollectionNames();
        return {
          success: true,
          message: `Found ${collections.length} collections`,
          data: collections.map(col => col.name)
        };

      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`,
          data: null
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error executing ${toolName}: ${error.message}`,
      data: null
    };
  }
};
