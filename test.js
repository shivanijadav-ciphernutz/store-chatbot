// test.js
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';

// Test queries
const testQueries = [
    "Add a new product with name test-toothbrush which costs 25 rupees and has code TEST001",
    "Find all products with price less than 50",
    "Add a new category called Test Category",
    "Find all categories",
    "Show me all collections in the database"
];

async function testAPI() {
    console.log('🧪 Testing MongoDB Demo API...\n');
    
    for (let i = 0; i < testQueries.length; i++) {
        const query = testQueries[i];
        console.log(`\n--- Test ${i + 1}: ${query} ---`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Success:', result.response);
                if (result.toolResults && result.toolResults.length > 0) {
                    result.toolResults.forEach((toolResult, index) => {
                        console.log(`   Tool ${index + 1} (${toolResult.tool}): ${toolResult.result.message}`);
                    });
                }
            } else {
                console.log('❌ Error:', result.message);
            }
            
        } catch (error) {
            console.log('❌ Network Error:', error.message);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 API testing completed!');
}

// Test direct endpoints
async function testDirectEndpoints() {
    console.log('\n🔗 Testing direct endpoints...\n');
    
    const endpoints = [
        '/api/products',
        '/api/categories', 
        '/api/collections'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ ${endpoint}: Found ${result.count} items`);
            } else {
                console.log(`❌ ${endpoint}: ${result.message}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
}

// Run tests
async function runTests() {
    try {
        await testAPI();
        await testDirectEndpoints();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { testAPI, testDirectEndpoints };

