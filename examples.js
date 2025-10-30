// examples.js
import dbOps from './db.js';

// Example queries to demonstrate the API functionality
export const exampleQueries = [
    // Product operations
    "Add a new product with name oral-b toothbrush which costs 30 rupees and has code OBTB",
    "Add multiple products: solid masti kurkure, cream and onion chips, rajasthani chatni kurkure. all three products with 10 rupees price. put them under category snacks",
    "Find all products with price less than 50",
    "Find all products in snacks category",
    "Update product with code OBTB to have price 35",
    "Delete all products with price greater than 100",
    
    // Category operations
    "Add a new category called Electronics with description Electronic devices and gadgets",
    "Find all categories",
    "Find products in Electronics category",
    
    // Multi-step operations
    "Add a new category called Sports and then add 2 products under it: football (₹500) and basketball (₹800)",
    "Create a category called Books and add 3 books: programming guide (₹200), cooking book (₹150), novel (₹100)",
    
    // Complex queries
    "Find all products with the same name more than once",
    "Get total sales by category",
    "Find products with price between 100 and 500",
    "List all products sorted by price",
    
    // Collection info
    "Show me all collections in the database",
    "What collections are available?"
];

// Function to run example queries
export async function runExamples() {
    console.log('🚀 Running example queries...\n');
    
    for (let i = 0; i < exampleQueries.length; i++) {
        const query = exampleQueries[i];
        console.log(`\n--- Example ${i + 1}: ${query} ---`);
        
        try {
            // This would normally call the API endpoint
            // For demonstration, we'll just log the query
            console.log(`Query: "${query}"`);
            console.log('✅ Query would be processed by the API');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
        
        // Add a small delay between examples
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 All examples completed!');
}

// Function to get random example query
export function getRandomExample() {
    const randomIndex = Math.floor(Math.random() * exampleQueries.length);
    return exampleQueries[randomIndex];
}

// Function to get examples by category
export function getExamplesByCategory(category) {
    const categories = {
        'insert': exampleQueries.filter(q => q.toLowerCase().includes('add') || q.toLowerCase().includes('create')),
        'find': exampleQueries.filter(q => q.toLowerCase().includes('find') || q.toLowerCase().includes('list') || q.toLowerCase().includes('show')),
        'update': exampleQueries.filter(q => q.toLowerCase().includes('update') || q.toLowerCase().includes('change')),
        'delete': exampleQueries.filter(q => q.toLowerCase().includes('delete') || q.toLowerCase().includes('remove')),
        'multi-step': exampleQueries.filter(q => q.toLowerCase().includes('and then') || q.toLowerCase().includes('then add')),
        'complex': exampleQueries.filter(q => q.toLowerCase().includes('total') || q.toLowerCase().includes('sorted') || q.toLowerCase().includes('between'))
    };
    
    return categories[category] || [];
}

// Run examples if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExamples();
}

