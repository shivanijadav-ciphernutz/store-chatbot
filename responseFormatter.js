// responseFormatter.js

class ResponseFormatter {
  constructor() {
    this.dateFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format the complete API response
  formatResponse(operation, result, collection) {
    const baseResponse = {
      success: true,
      operation: this.formatOperationName(operation),
      collection: collection,
      timestamp: this.dateFormatter.format(new Date())
    };

    switch (operation) {
      case 'insert':
        return this.formatInsertResponse(baseResponse, result);
      case 'find':
        return this.formatFindResponse(baseResponse, result);
      case 'update':
        return this.formatUpdateResponse(baseResponse, result);
      case 'delete':
        return this.formatDeleteResponse(baseResponse, result);
      case 'aggregate':
        return this.formatAggregateResponse(baseResponse, result);
      default:
        return baseResponse;
    }
  }

  // Format operation name for display
  formatOperationName(operation) {
    const operationNames = {
      'insert': 'Add/Insert',
      'find': 'Search/Find',
      'update': 'Update/Modify',
      'delete': 'Delete/Remove',
      'aggregate': 'Aggregate/Analyze'
    };
    return operationNames[operation] || operation;
  }

  // Format insert operation response
  formatInsertResponse(baseResponse, result) {
    if (result.insertedCount) {
      // Bulk insert
      return {
        ...baseResponse,
        message: `Successfully added ${result.insertedCount} new ${baseResponse.collection}`,
        summary: {
          totalAdded: result.insertedCount,
          items: result.documents.map((doc, index) => ({
            itemNumber: index + 1,
            name: doc.name || doc.title || 'Unnamed Item',
            price: doc.price ? `₹${doc.price}` : 'No price',
            category: doc.category || 'No category',
            code: doc.code || 'No code',
            id: result.insertedIds[index]
          }))
        }
      };
    } else {
      // Single insert
      return {
        ...baseResponse,
        message: `Successfully added new ${baseResponse.collection.slice(0, -1)}`,
        summary: {
          name: result.document.name || result.document.title || 'Unnamed Item',
          price: result.document.price ? `₹${result.document.price}` : 'No price',
          category: result.document.category || 'No category',
          code: result.document.code || 'No code',
          id: result.insertedId
        }
      };
    }
  }

  // Format find operation response
  formatFindResponse(baseResponse, result) {
    return {
      ...baseResponse,
      message: `Found ${result.count} ${baseResponse.collection} matching your search`,
      summary: {
        totalFound: result.count,
        items: result.documents.map((doc, index) => {
          const formattedItem = {
            itemNumber: index + 1,
            id: doc._id
          };
          
          // Dynamically format fields based on what's available in the document
          Object.keys(doc).forEach(key => {
            if (key === '_id') return; // Skip _id as it's handled separately
            
            const value = doc[key];
            if (value !== null && value !== undefined) {
              // Format common field types
              if (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost')) {
                formattedItem[key] = typeof value === 'number' ? `₹${value}` : value;
              } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
                formattedItem[key] = this.formatDate(value);
              } else if (key.toLowerCase().includes('email')) {
                formattedItem[key] = value;
              } else if (key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) {
                formattedItem[key] = value;
              } else {
                formattedItem[key] = value;
              }
            } else {
              formattedItem[key] = 'No ' + key;
            }
          });
          
          return formattedItem;
        })
      }
    };
  }

  // Format date values
  formatDate(value) {
    try {
      if (value instanceof Date) {
        return this.dateFormatter.format(value);
      } else if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return this.dateFormatter.format(date);
        }
      }
      return value;
    } catch (error) {
      return value;
    }
  }

  // Format update operation response
  formatUpdateResponse(baseResponse, result) {
    return {
      ...baseResponse,
      message: `Updated ${result.modifiedCount} ${baseResponse.collection} (found ${result.matchedCount} matching items)`,
      summary: {
        totalMatched: result.matchedCount,
        totalUpdated: result.modifiedCount,
        changes: this.formatUpdateChanges(result.update)
      }
    };
  }

  // Format delete operation response
  formatDeleteResponse(baseResponse, result) {
    return {
      ...baseResponse,
      message: `Deleted ${result.deletedCount} ${baseResponse.collection}`,
      summary: {
        totalDeleted: result.deletedCount
      }
    };
  }

  // Format aggregation operation response
  formatAggregateResponse(baseResponse, result) {
    // Check if this is a duplicate detection query
    const isDuplicateQuery = result.documents.some(doc => doc.count > 1);
    
    if (isDuplicateQuery) {
      return this.formatDuplicateProductsResponse(baseResponse, result);
    }
    
    return {
      ...baseResponse,
      message: `Aggregation completed: Found ${result.count} result groups`,
      summary: {
        totalGroups: result.count,
        groups: result.documents.map((group, index) => ({
          groupNumber: index + 1,
          name: group._id || 'Unknown',
          count: group.count || 0,
          items: group.products || group.items || [],
          totalPrice: group.totalPrice ? `₹${group.totalPrice}` : 'N/A'
        }))
      }
    };
  }

  // Format duplicate products response specifically
  formatDuplicateProductsResponse(baseResponse, result) {
    const duplicateProducts = result.documents.filter(doc => doc.count > 1);
    
    return {
      ...baseResponse,
      message: `Found ${duplicateProducts.length} products with duplicate names`,
      summary: {
        totalDuplicates: duplicateProducts.length,
        duplicateProducts: duplicateProducts.map((product, index) => ({
          duplicateNumber: index + 1,
          productName: product._id,
          duplicateCount: product.count,
          instances: product.products.map((instance, idx) => ({
            instanceNumber: idx + 1,
            id: instance._id,
            price: instance.price ? `₹${instance.price}` : 'No price',
            category: instance.category || 'No category',
            code: instance.code || 'No code'
          }))
        }))
      }
    };
  }

  // Format update changes for readability
  formatUpdateChanges(update) {
    const changes = [];
    
    if (update.$set) {
      Object.entries(update.$set).forEach(([key, value]) => {
        if (key === 'price') {
          changes.push(`${key}: ₹${value}`);
        } else {
          changes.push(`${key}: ${value}`);
        }
      });
    }
    
    if (update.$inc) {
      Object.entries(update.$inc).forEach(([key, value]) => {
        changes.push(`${key}: increased by ${value}`);
      });
    }
    
    return changes.length > 0 ? changes.join(', ') : 'No specific changes shown';
  }

  // Format error response
  formatErrorResponse(error, message) {
    return {
      success: false,
      error: error,
      message: message,
      timestamp: this.dateFormatter.format(new Date()),
      suggestion: this.getErrorSuggestion(error)
    };
  }

  // Get helpful suggestions for common errors
  getErrorSuggestion(error) {
    const suggestions = {
      'Network Error': 'Please check if the API server is running on localhost:3000',
      'Failed to parse operation': 'Try rephrasing your query with clearer product details',
      'Invalid operation structure': 'Make sure your query includes specific product information',
      'BSON field error': 'The query format might be incorrect. Try using simpler language.'
    };
    
    return suggestions[error] || 'Please try rephrasing your query or check the API documentation.';
  }
}

export default new ResponseFormatter();
