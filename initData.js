// initData.js
import dbOps from './db.js';

async function initializeSampleData() {
  try {
    console.log('Initializing sample data...');

    // Create sample categories
    const categories = [
      {
        name: "Electronics",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Health & Beauty",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Home & Garden",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert categories
    const categoryResult = await dbOps.insertDocuments('categories', categories);
    console.log(`Inserted ${categoryResult.insertedCount} categories`);

    // Create sample products
    const products = [
      {
        name: "Wireless Headphones",
        price: 2500,
        category_id: "Electronics",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Electric Toothbrush",
        price: 1500,
        category_id: "Health & Beauty",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Smart Watch",
        price: 8000,
        category_id: "Electronics",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Garden Hose",
        price: 800,
        category_id: "Home & Garden",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Face Moisturizer",
        price: 450,
        category_id: "Health & Beauty",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert products
    const productResult = await dbOps.insertDocuments('products', products);
    console.log(`Inserted ${productResult.insertedCount} products`);

    // Verify data
    const allProducts = await dbOps.findDocuments('products');
    const allCategories = await dbOps.findDocuments('categories');
    
    console.log('\nSample data initialized successfully!');
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Total categories: ${allCategories.length}`);
    
    console.log('\nCategories:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name}`);
    });
    
    console.log('\nProducts:');
    allProducts.forEach(prod => {
      console.log(`  - ${prod.name}: ₹${prod.price} - ${prod.category_id}`);
    });

  } catch (error) {
    console.error('Error initializing sample data:', error);
  } finally {
    await dbOps.close();
  }
}

// Run initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSampleData();
}

export { initializeSampleData };
