require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const requestIp = require('request-ip');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const Logger = require('./Logger.js');
const PageManager = require('./PageManager.js');
const SessionManager = require('./RedisManager.js');
const DBManager = require('./MongoDBManager.js');
const UserManager = require('./UserManager.js');
const Filemanager = require('./Filemanager.js');
const recRoutes = require('./routes/recroom/index.js'); // This shits ass ngl. - your gay
const XboxShit = require('./XboxAPI.js');
const app = express();
const PORT = process.env.PORT;

app.set('trust proxy', 1); 
app.use(session(
{
    store: SessionManager.createRedisSessionStore(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }
}));

app.use(morgan((tokens, req, res) => 
{
    return 
    [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        'IP:', req.clientIp
    ].join(' ');
}));
app.use(requestIp.mw());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'WebUi'));
app.use(express.static(path.join(__dirname, 'WebUi')));
app.use(cookieParser());

app.get('/', PageManager.LoadHomePage);
app.get('/dash', PageManager.LoadDash);
app.get('/dash/client', PageManager.LoadClient);
app.get('/dash/client/settings', PageManager.LoadSettings);
app.get('/dash/admin/users', PageManager.LoadAdmin);
app.get('/dash/admin/users/create/htmx', PageManager.LoadAdminUser);
app.get('/dash/logout', PageManager.Logout);
app.get('/dash/admin/users/htmx/create', PageManager.LoadAdminCreate);
app.get('/dash/admin/users/htmx/list', PageManager.LoadAdminList);
app.get('/auth', PageManager.LoadLogin);
app.get('/assets/zopzfiles/onlinefilters.json', Filemanager.LoadFilters);
app.get('/api/stats', UserManager.GetUserStats);
app.get('/api/label/list', Filemanager.LoadLables);

app.post('/api/auth', UserManager.UserAuth);
app.post('/api/label', UserManager.AddLable)
app.post('/dash/client/reset/hardware', UserManager.ResetHWID);
app.post('/auth/login', UserManager.LoginHandler);
app.post('/auth/register', UserManager.RegisterHandler);
app.post('/dash/actions/redeem', UserManager.RedeemKey)
app.post('/dash/client/reset/password', UserManager.ResetPassword);
app.post('/dash/admin/users', UserManager.AdminCreateUser);

app.put('/dash/admin/users', UserManager.AdminEditUser);

app.use(recRoutes);
app.use(XboxShit);


setInterval(async () => 
{
    try 
    {
        await DBManager.reconnectToDatabase();
        Logger.Log(`Reconnected to the database successfully.`);
    } 
    catch (error) 
    {
        Logger.Log(`Error reconnecting to the database: ${error}`);
    }
}, 12 * 60 * 60 * 1000);

app.listen(PORT, async () => 
{ 
    await DBManager.connectToDatabase(); 
    Logger.Log(`Server is running on port ${PORT}`);
});