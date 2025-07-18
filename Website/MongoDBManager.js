require('dotenv').config();
const { MongoClient } = require("mongodb");
const Logger = require('./Logger.js');

const MONGO_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE;
const CHAT_COLLECTION = process.env.MONGODB_CHAT_COLLECTION;
const LABELS_COLLECTION = process.env.MONGODB_LABELS_COLLECTION;
const USER_COLLECTION = process.env.MONGODB_USER_COLLECTION;
const LICENCE_COLLECTION = process.env.MONGODB_LICENCE_COLLECTION;

let cachedMongoClient = null;

async function connectToDatabase() 
{
  if (cachedMongoClient && cachedMongoClient.isConnected()) 
  {
    Logger.Log('Already connected to MongoDB.');
    return;
  }
  try 
  {
    Logger.Log('Connecting to MongoDB...');
    cachedMongoClient = new MongoClient(MONGO_URI);
    await cachedMongoClient.connect();
    Logger.Log('Connected to MongoDB successfully.');
  } 
  catch (err) 
  {
    Logger.Log(`Failed to connect to MongoDB: ${err.message}`);
    throw err;
  }
}

async function reconnectToDatabase() 
{
  try 
  {
    Logger.Log('Reconnecting to MongoDB...');
    if (cachedMongoClient) 
    {
      await cachedMongoClient.close();
      Logger.Log('Closed existing MongoDB connection.');
    }
    cachedMongoClient = new MongoClient(MONGO_URI);
    await cachedMongoClient.connect();
    Logger.Log('Reconnected to MongoDB successfully.');
  } 
  catch (err) 
  {
    Logger.Log(`Failed to reconnect to MongoDB: ${err.message}`);
    throw err; 
  }
}

function getCollection(collectionName) 
{
  if (!cachedMongoClient) 
  {
    throw new Error('MongoDB client is not connected. Call connectToDatabase() first.');
  }
  return cachedMongoClient.db(DATABASE_NAME).collection(collectionName);
}

async function findDocumentByKey(key, value, collectionName) 
{
  try 
  {
    const collection = getCollection(collectionName);
    const query = { [key]: value };
    const document = await collection.findOne(query);
    return document;
  } 
  catch (err) 
  {
    Logger.Log(`Error finding document by key (${key}=${value}) in ${collectionName}: ${err.message}`);
    throw err;
  }
}

async function updateDocumentByKey(key, value, updateObj, collectionName) 
{
  try 
  {
    const collection = getCollection(collectionName);
    const query = { [key]: value };
    const update = { $set: updateObj };

    const result = await collection.updateOne(query, update);
    if (result.matchedCount === 0) 
    {
      Logger.Log(`No documents matched the query (${key}=${value}) in ${collectionName}.`);
    }
    return result;
  } catch (err) 
  {
    Logger.Log(`Error updating document by key (${key}=${value}) in ${collectionName}: ${err.message}`);
    throw err;
  }
}

async function updateDocumentarrayByKey(key, value, updateObj, collectionName) 
{
  try 
  {
    const collection = getCollection(collectionName);
    const query = { [key]: value };
    const update = { $push: updateObj };
    const result = await collection.updateOne(query, update);
    if (result.matchedCount === 0) 
    {
      Logger.Log(`No documents matched the query (${key}=${value}) in ${collectionName}.`);
    }
    return result;
  } catch (err) 
  {
    Logger.Log(`Error updating document by key (${key}=${value}) in ${collectionName}: ${err.message}`);
    throw err;
  }
}

async function updateAndRetrieveDocumentByKey(key, value, updateObj, collectionName) 
{
  try 
  {
    await updateDocumentByKey(key, value, updateObj, collectionName);
    return await findDocumentByKey(key, value, collectionName);
  } 
  catch (err) 
  {
    Logger.Log(`Error updating and retrieving document by key (${key}=${value}) in ${collectionName}: ${err.message}`);
    throw err;
  }
}

async function addDocument(document, collectionName) 
{
  try 
  {
    const collection = getCollection(collectionName);
    const result = await collection.insertOne(document);
    Logger.Log(`Inserted document with _id: ${result.insertedId} into ${collectionName}.`);
    return result;
  } 
  catch (err) 
  {
    Logger.Log(`Error adding document to ${collectionName}: ${err.message}`);
    throw err;
  }
}

async function hasKey(key, value, collectionName) 
{
  try 
  {
    const document = await findDocumentByKey(key, value, collectionName);
    return document !== null;
  } 
  catch (err) 
  {
    Logger.Log(`Error checking existence of key (${key}=${value}) in ${collectionName}: ${err.message}`);
    return false;
  }
}

async function disconnectFromDatabase() 
{
  try 
  {
    if (cachedMongoClient) 
    {
      await cachedMongoClient.close();
      Logger.Log('Disconnected from MongoDB.');
      cachedMongoClient = null;
    }
  } 
  catch (err) 
  {
    Logger.Log(`Error disconnecting from MongoDB: ${err.message}`);
  }
}
async function CollectionsCount(collectionName)
{
  try 
  {
    const collection = getCollection(collectionName);
    const count = await collection.countDocuments();
    return count;
  } 
  catch (err) 
  {
    Logger.Log(`Error counting documents in ${collectionName}: ${err.message}`);
    throw err;
  }
}

module.exports = 
{
  connectToDatabase,
  reconnectToDatabase,
  disconnectFromDatabase,
  findDocumentByKey,
  updateDocumentByKey,
  updateDocumentarrayByKey,
  updateAndRetrieveDocumentByKey,
  addDocument,
  hasKey,
  CHAT_COLLECTION,
  LABELS_COLLECTION,
  USER_COLLECTION,
  LICENCE_COLLECTION,
  CollectionsCount,
  getCollection
};