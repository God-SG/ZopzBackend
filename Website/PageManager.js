require('dotenv').config();
const Render = new (require('./Render.js'))(false);
const { USER_COLLECTION, CollectionsCount, getCollection } = require('./MongoDBManager.js');

const LoadHomePage = Render.renderPage('home');
const LoadLogin = Render.renderPage('auth');

const LoadDash = async (req, res) => 
{
   const totalUsers = await CollectionsCount(USER_COLLECTION);
   console.log(req.session.user);
   console.log(req.headers);
   return Render.renderIfAuthenticated(req, res, 'dash/base.ejs', { user: req.session.user, totalUsers })
};

const LoadClient = async (req, res) => 
{
    const totalUsers = await CollectionsCount(USER_COLLECTION);
    return Render.renderIfAuthenticated(req, res, 'dash/client/page.ejs', { user: req.session.user, totalUsers })
};

const LoadSettings = async (req, res) => 
{
  const totalUsers = await CollectionsCount(USER_COLLECTION);
  return Render.renderIfAuthenticated(req, res, 'dash/client/settings.ejs', { user: req.session.user, totalUsers })
};

const LoadAdmin = async (req, res) => 
{
    const totalUsers = await CollectionsCount(USER_COLLECTION);
    const users = await getCollection(USER_COLLECTION).find().toArray();
    return Render.renderIfAuthenticated(req, res, 'dash/admin/page.ejs', { user: req.session.user, totalUsers, users });
};

const LoadAdminList = async (req, res) => 
{
    const totalUsers = await CollectionsCount(USER_COLLECTION);
    const users = await getCollection(USER_COLLECTION).find().toArray();
    return Render.renderIfAuthenticated(req, res, 'dash/admin/htmx/users/list.ejs', { user: req.session.user, totalUsers, users });
};

const LoadAdminCreate = async (req, res) => 
{
    const totalUsers = await CollectionsCount(USER_COLLECTION);
    return Render.renderIfAuthenticated(req, res, 'dash/admin/htmx/users/creation.ejs', { user: req.session.user, totalUsers })
};

const LoadAdminUser = async (req, res) => 
{
    const totalUsers = await CollectionsCount(USER_COLLECTION);
    return Render.renderIfAuthenticated(req, res, 'dash/admin/users.ejs', { user: req.session.user, totalUsers })
}

const Logout = (req, res) => 
{
    req.session.destroy();
    res.clearCookie('authorization');
    return res.redirect('/');
};

const RegisterHandler = async (req, res) => 
{
    const { username, password } = req.body;
    if (!username || !password) 
    {
        return res.status(400).send('Username and password are required');
    }
    if (await hasKey('username', username.toLowerCase(), USER_COLLECTION)) 
    {
        return res.status(403).send('User already exists');
    }
    await addDocument(
    {
        username: username.toLowerCase(),
        password: await hash(password),
        level: 0,
        banned: false,
        created: new Date().toISOString().replace('Z', '+00:00'),
        last_login: null,
        programs: []
    }, USER_COLLECTION);
    return res.status(200).send('User created, now login');
};

const LoginHandler = async (req, res) => 
{
    const { username, password } = req.body;
    if (!username || !password) 
    {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    let user = await findDocumentByKey('username', username.toLowerCase(), USER_COLLECTION);
    if (!user) 
    {
        return res.status(403).json({ error: 'User isn\'t valid' });
    }
    if (!await verifyPassword(user.password, password))
    {
        return res.status(403).json({ error: 'Incorrect password' });
    }
    await updateDocumentByKey('username', username.toLowerCase(), 
    {
        last_login: new Date().toISOString().replace('Z', '+00:00')
    }, USER_COLLECTION);
    const programs = user.programs || [];
    req.session.user = { username, programs, level: user.level };
    console.log(req.session.user)
    res.cookie('authorization', xorEncrypt(`${username}:${password}`)); // Keps for backwords compatilbilty with chat. PC
    return res.status(200).json({ message: 'Logged in' });
};

module.exports = 
{
    LoadHomePage,
    LoadDash,
    LoadClient,
    LoadSettings,
    LoadAdmin,
    LoadAdminList,
    LoadAdminCreate,
    LoadAdminUser,
    Logout,
    LoadLogin,
    RegisterHandler,
    LoginHandler
};