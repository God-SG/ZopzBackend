require('dotenv').config();
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const Logger = require('./Logger.js');

let redisClient;

const getRedisClient = () => 
{
    if (redisClient) 
    {
        return redisClient;
    }
    redisClient = createClient(
    {
        socket: 
        {
            host: 'localhost',
            port: 6379
        },
    });
    redisClient.on('error', (err) => 
    {
        Logger.Log('Redis Client Error:', err);
    });

    redisClient.on('connect', () => 
    {
        Logger.Log('Connected to Redis successfully.');
    });

    redisClient.on('ready', () => 
    {
        Logger.Log('Redis client is ready to use.');
    });
    redisClient.connect().catch((err) => 
    {
        Logger.Log('Failed to connect to Redis:', err);
    });
    return redisClient;
};


const createRedisSessionStore = () => 
{
    return new RedisStore(
    {
        client: getRedisClient(),
        prefix: 'session:',
    });
};

module.exports = 
{
    createRedisSessionStore,
};