const http = require('http');
const socketIo = require('socket.io');
const { xorDecrypt } = require('./Utils.js');
const 
{

    getCollection, 
    connectToDatabase,
    findDocumentByKey,
    USER_COLLECTION,
    CHAT_COLLECTION,
} = require('./MongoDBManager.js');

const XorKey = 
[
    0x69, 
    'W'.charCodeAt(0), 
    'e'.charCodeAt(0), 
    ' '.charCodeAt(0), 
    'P'.charCodeAt(0),
    'r'.charCodeAt(0), 
    'o'.charCodeAt(0), 
    't'.charCodeAt(0),
    'e'.charCodeAt(0),
    'c'.charCodeAt(0), 
    't'.charCodeAt(0), 
    0x69 
];

const server = http.createServer();

const io = socketIo(server, 
{
    path: '/', 
});

io.of("/chat").on("connection", async (socket) => 
{
    const authHeader = socket.handshake.headers.authorization; 
    if (!authHeader) 
    {
        return socket.disconnect(true);
    }
    const decryptedAuth = xorDecrypt(authHeader, XorKey);
    if (!decryptedAuth) 
    {
        return socket.disconnect(true);
    }
    const [username, password] = decryptedAuth.split(":");
    const user = await findDocumentByKey('username', username.toLowerCase(), USER_COLLECTION);
    if (!user) 
    {
        return socket.disconnect(true);
    }
    socket.userContext = { user, room: null };
    console.log(`User ${user.username} connected to chat.`);
    socket.on("joinRoom", async (room) => 
    {
        if (socket.userContext.room) 
        {
            socket.leave(socket.userContext.room);
        }
        socket.join(room);
        socket.userContext.room = room;
        console.log(`User ${user.username} joined room: ${room}`);
        const messages = await getCollection(CHAT_COLLECTION).find({ "data.room": room }).toArray();
        socket.emit("messages", messages.map(m => 
        ({
            message: m.data?.message || "Unknown", 
            sent: m.data?.timestamp || new Date(), 
            poster: m.data?. poster || "Anonymous"  
        })));
    });
    socket.on("sendMessage", async (message) => 
    {
        if (!socket.userContext.room) return;
        await getCollection(CHAT_COLLECTION).insertOne(
        {
            data: 
            {
                room: socket.userContext.room,
                poster: user.username,
                message: message,
                timestamp: new Date()
            },
        });
        socket.emit("message", 
        {
           room: socket.userContext.room,
           poster: user.username,
           message: message,
           timestamp: new Date()
        });
    });
    socket.on("disconnect", () => 
    {
        console.log(`User ${user.username} disconnected.`);
    });
});

server.listen(3000, '0.0.0.0', async () => 
{
  await connectToDatabase();
  console.log('Server listening on http://localhost:3000');
});