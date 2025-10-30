# MongoDB Demo API with LLM Tool Calling

A scalable API that performs database operations based on natural language input using MongoDB and Google Gemini AI with tool calling capabilities.

## Features

- **Natural Language Processing**: Convert human language queries into database operations
- **Tool Calling**: LLM uses bound tools to execute database operations
- **Multi-step Operations**: Support for complex operations like "add category and then add products"
- **Scalable Architecture**: Easy to add new collections and operations
- **Real-time Feedback**: Clear responses about what operations were performed
- **Web Interface**: User-friendly frontend for testing queries

## Architecture

### Core Components

1. **Database Operations (`db.js`)**: MongoDB connection and basic CRUD operations
2. **LLM Integration (`llm.js`)**: Google Gemini AI setup
3. **Tool Definitions (`databaseTools.js`)**: Database tools bound to LLM
4. **API Server (`app.js`)**: Express server with endpoints
5. **Frontend (`public/index.html`)**: Web interface for testing

### Tool Calling Flow

1. User submits natural language query
2. LLM analyzes query and determines required tools
3. Tools are executed with appropriate parameters
4. Results are returned to LLM for final response
5. User receives formatted response

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB instance
- Google AI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=your_database_name
   GOOGLE_API_KEY=your_google_ai_api_key
   PORT=3000
   ```

4. Initialize sample data:
   ```bash
   node initData.js
   ```

5. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Main Query Endpoint
- **POST** `/api/query` - Process natural language database operations
  ```json
  {
    "query": "Add a new product with name oral-b toothbrush which costs 30 rupees and has code OBTB"
  }
  ```

### Data Endpoints
- **GET** `/api/products` - Get all products
- **GET** `/api/categories` - Get all categories  
- **GET** `/api/collections` - Get all collections

## Available Tools

### Product Operations
- `insert_product` - Add new products
- `find_products` - Search products
- `update_product` - Modify products
- `delete_product` - Remove products

### Category Operations
- `insert_category` - Add new categories
- `find_categories` - Search categories

### Utility Operations
- `get_collection_info` - List available collections

## Example Queries

### Simple Operations
```
Add a new product with name oral-b toothbrush which costs 30 rupees and has code OBTB
Find all products with price less than 50
Update product with code OBTB to have price 35
Delete all products with price greater than 100
```

### Multi-step Operations
```
Add a new category called Sports and then add 2 products under it: football (₹500) and basketball (₹800)
Create a category called Books and add 3 books: programming guide (₹200), cooking book (₹150), novel (₹100)
```

### Complex Queries
```
Find all products with the same name more than once
Get total sales by category
Find products with price between 100 and 500
List all products sorted by price
```

## Database Schema

### Products Collection
```javascript
{
  name: String,
  price: Number,
  code: String,
  category: String (optional),
  description: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Categories Collection
```javascript
{
  name: String,
  description: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Adding New Collections

To add a new collection (e.g., `orders`):

1. **Add tool definition** in `databaseTools.js`:
   ```javascript
   {
     name: "insert_order",
     description: "Insert a new order into the orders collection",
     parameters: {
       type: "object",
       properties: {
         userId: { type: "string", description: "User ID" },
         items: { type: "array", description: "Order items" },
         total: { type: "number", description: "Total amount" }
       },
       required: ["userId", "items", "total"]
     }
   }
   ```

2. **Add execution logic** in `executeTool` function:
   ```javascript
   case "insert_order":
     const orderDoc = {
       userId: parameters.userId,
       items: parameters.items,
       total: parameters.total,
       createdAt: new Date(),
       updatedAt: new Date()
     };
     const orderResult = await dbOps.insertDocument("orders", orderDoc);
     return {
       success: true,
       message: `Order created successfully with ID: ${orderResult.insertedId}`,
       data: orderResult
     };
   ```

3. **Update system message** in `app.js` to include new collection schema

4. **Add API endpoint** for direct access:
   ```javascript
   app.get('/api/orders', async (req, res) => {
     try {
       const orders = await dbOps.findDocuments('orders');
       res.json({ success: true, data: orders, count: orders.length });
     } catch (error) {
       res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
     }
   });
   ```

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Invalid parameters or missing required fields
- **Database Errors**: Connection issues or query failures
- **LLM Errors**: AI processing failures
- **Tool Execution Errors**: Individual tool failures

## Frontend Features

- **Query Interface**: Natural language input
- **Example Queries**: Pre-built examples for testing
- **Result Display**: Formatted results with proper object handling
- **Connection Testing**: Verify API connectivity
- **Responsive Design**: Works on desktop and mobile

## Development

### Running Tests
```bash
npm test
```

### Adding New Tools
1. Define tool schema in `databaseTools.js`
2. Add execution logic in `executeTool` function
3. Update system message with new capabilities
4. Test with example queries

### Debugging
- Check MongoDB connection
- Verify Google AI API key
- Review tool execution logs
- Test individual endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the examples in `examples.js`
- Review the API documentation
- Test with the web interface
- Check MongoDB and AI API connectivity