// db.js
import { MongoClient } from "mongodb";
import 'dotenv/config';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const db = client.db(process.env.MONGODB_DB);

// Database operations class for scalable collection management
class DatabaseOperations {
  constructor() {
    this.db = db;
    this.client = client;
  }

  // Get a specific collection
  getCollection(collectionName) {
    return this.db.collection(collectionName);
  }

  // Insert multiple documents into a collection
  async insertDocuments(collectionName, documents) {
    const collection = this.getCollection(collectionName);
    return await collection.insertMany(documents);
  }

  // Insert a single document into a collection
  async insertDocument(collectionName, document) {
    const collection = this.getCollection(collectionName);
    return await collection.insertOne(document);
  }

  // Find documents in a collection
  async findDocuments(collectionName, query = {}, projection = {}) {
    const collection = this.getCollection(collectionName);
    return await collection.find(query).project(projection).toArray();
  }

  // Find documents with pagination and sorting, returning items and total count
  async findDocumentsPaginated(
    collectionName,
    { query = {}, projection = {}, sort = {}, skip = 0, limit = 20 } = {}
  ) {
    const collection = this.getCollection(collectionName);
    const cursor = collection
      .find(query)
      .project(projection)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const [items, total] = await Promise.all([
      cursor.toArray(),
      collection.countDocuments(query)
    ]);

    return { items, total };
  }

  // Update documents in a collection
  async updateDocuments(collectionName, query, update) {
    const collection = this.getCollection(collectionName);
    return await collection.updateMany(query, update);
  }

  // Delete documents from a collection
  async deleteDocuments(collectionName, query) {
    const collection = this.getCollection(collectionName);
    return await collection.deleteMany(query);
  }

  // Execute aggregation pipeline on a collection
  async aggregateDocuments(collectionName, pipeline) {
    const collection = this.getCollection(collectionName);
    return await collection.aggregate(pipeline).toArray();
  }

  // Get all collection names
  async getCollectionNames() {
    return await this.db.listCollections().toArray();
  }

  // Close the database connection
  async close() {
    await this.client.close();
  }
}

const dbOps = new DatabaseOperations();

export default dbOps;