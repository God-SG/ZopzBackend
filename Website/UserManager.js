const
{
    findDocumentByKey,
    updateDocumentByKey,
    updateDocumentarrayByKey,
    addDocument,
    hasKey,
    getCollection,
    USER_COLLECTION,
    LICENCE_COLLECTION,
    LABELS_COLLECTION
} = require('./MongoDBManager.js');

const 
{ 
    hash, 
    verifyPassword, 
    xorEncrypt 
} = require('./Utils.js');

const ResetHWID = async (req, res) =>
{
   if (req.session && req.session.user && req.session.user.username)
   {
      const { program } = req.body; 
      const user = await findDocumentByKey('username', req.session.user.username.toLowerCase(), USER_COLLECTION);
      if (user && user.programs)
      {
        const programIndex = user.programs.findIndex(p => p.name === program);
        if (programIndex === -1) 
        {
            return res.status(404).json({ error: "Program not found" });
        }
        await updateDocumentByKey('username', user.username.toLowerCase(), 
        {
            [`programs.${programIndex}.hardware_identifier`]: '',
            [`programs.${programIndex}.last_reset`]: new Date().toISOString().replace('Z', '+00:00')
        }, USER_COLLECTION);
        return res.json({ message: "HWID reset successfully!" });
      }
      else
      {
        return res.status(404).json({ error: "User has no programs" });
      }
   }
   else
   {
      return res.status(400).json({ error: "User not logged in" });
   }
};

const ResetPassword = async (req, res) => 
{
   if (req.session && req.session.user && req.session.user.username)
   {
      const { currentPassword, newPassword  } = req.body; 
      const user = await findDocumentByKey('username', req.session.user.username.toLowerCase(), USER_COLLECTION); 
      if (user)
      {
        if (!await verifyPassword(user.password, currentPassword))
        {
           return res.status(403).send('Incorrect password');
        }
        const hashedPassword = await hash(newPassword);
        await updateDocumentByKey('username', user.username.toLowerCase(), 
        {
            'password': hashedPassword
        }, USER_COLLECTION);
        return res.json({ message: "Password updated successfully!" });
      }
      else
      {
        return res.status(404).json({ error: "User has isnt valid" });
      }
   }
};
 
const RedeemKey = async (req, res) => 
{
   if (!req.session || !req.session.user || !req.session.user.username) 
   {
        return res.status(404).send('Session is required');
   }
   const { key } = req.body;
   const licensedata = await findDocumentByKey('license', key, LICENCE_COLLECTION);
   if (!licensedata || licensedata.redeemer) 
   {
        return res.status(404).json({ error: "License is not valid or already redeemed" });
   }
   updateDocumentarrayByKey('username', req.session.user.username.toLowerCase(), 
   {
        programs: 
        {
            name: licensedata.product,
            hardware_identifier: '',
            expiry: '2030-12-27T00:00:00.000+00:00',
            last_reset: '2030-12-27T00:00:00.000+00:00'
        }
   }, USER_COLLECTION);
   updateDocumentByKey('license', key, 
   {
        redeemer: req.session.user.username.toLowerCase(),
   }, LICENCE_COLLECTION);
   const username = req.session.user.username.toLowerCase();
   const user = await findDocumentByKey('username', username, USER_COLLECTION);
   const programs = user.programs || [];
   req.session.user = { username, programs, level: user.level };
   return res.status(200).json({ message: 'product redeemed' });
};

const AdminCreateUser = async (req, res) => 
{
   if (!req.session || !req.session.user || !req.session.user.username) 
   {
        return res.status(404).send('Session is required');
   }
   const { username, password, level } = req.body; 
   const user = await findDocumentByKey('username', req.session.user.username.toLowerCase(), USER_COLLECTION);
   const dbuser = await findDocumentByKey('username', username.toLowerCase(), USER_COLLECTION);
   if (user.level === 3 && !dbuser)
   {
     await addDocument(
     {
          username: username.toLowerCase(),
          password: await hash(password),
          level: parseInt(level),
          banned: false,
          created: new Date().toISOString().replace('Z', '+00:00'),
          last_login: null,
          programs: []
     }, USER_COLLECTION);
     return res.status(200).json({ message: 'Created User' });
   }
};

const AdminEditUser = async (req, res) => // Will Add program editing for Admin user later
{
  if (!req.session || !req.session.user || !req.session.user.username) 
  {
    return res.status(404).send('Session is required');
  }
  const { username, banned } = req.body;
  //const user = await findDocumentByKey('username', username.toLowerCase(), USER_COLLECTION);
  await updateDocumentByKey('username', username.toLowerCase(), 
  {
    banned: banned === 'on'
  }, USER_COLLECTION);
  return res.status(200).json({ message: 'Updated User' });
};

const GetUserStats = async (req, res) => 
{
  const users = await getCollection(USER_COLLECTION).find().toArray();
  const stats = 
  {
    total_user_count: users.length,
    banned_users: users.filter(user => user.banned).length,
    program_statistics: {},
  };
  users.forEach(user => 
  {
      if (user.programs && Array.isArray(user.programs))
      {
        user.programs.forEach(program => 
        {
            if (!stats.program_statistics[program.name]) 
            {
                stats.program_statistics[program.name] = 
                {
                    user_count: 0,
                    total_active_users: 0,
                };
            }
            stats.program_statistics[program.name].user_count++;
            const expiryDate = new Date(program.expiry);
            if (!isNaN(expiryDate) && expiryDate > new Date()) 
            {
                stats.program_statistics[program.name].total_active_users++;
            }
        });
      }
   });
   return res.json(stats);
};

const UserAuth = async (req, res) => 
{
    const { username, password, program, hardwareIdentifier } = req.body;
    if (!username || !password || !program || !hardwareIdentifier) 
    {
        return res.status(400).json({ success: false, message: "Invalid Request Body" });
    }
    const user = await findDocumentByKey("username", username.toLowerCase(), USER_COLLECTION);
    if (!user) 
    {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const userProgram = user.programs?.find(p => p.name === program);
    if (!userProgram) 
    {
        return res.status(403).json({ success: false, message: "Authentication Failed" });
    }
    if (!userProgram.hardware_identifier) 
    {
        await updateDocumentByKey('username', user.username.toLowerCase(), 
        {
            [`programs.${user.programs.findIndex(p => p.name === program)}.hardware_identifier`]: hardwareIdentifier,
        }, USER_COLLECTION);
    } 
    else if (hardwareIdentifier !== userProgram.hardware_identifier) 
    {
        return res.status(403).json({ success: false, message: "HWID mismatch" });
    }
    const { _id, ...cleanedUser } = user;
    return res.status(200).json(
    {
        success: true,
        message: xorEncrypt(`${username}:${password}`),
        data: cleanedUser,
    });
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
    res.cookie('authorization', xorEncrypt(`${username}:${password}`)); // Keps for backwords compatilbilty with chat. PC
    return res.status(200).json({ message: 'Logged in' });
};
   
const AddLable = async (req, res) => 
{
    const { name, value } = req.body;
    if (!name || !value)
    {
        return res.status(403).json({ success: false, message: "Invalid Request Body" });
    }
    if (await hasKey('name', name.toLowerCase(), LABELS_COLLECTION))
    {
        return res.status(403).json({ success: false, message: "label already exists" });
    }
    await addDocument(
    {
        name: name.toLowerCase(),
        value: value
    }, LABELS_COLLECTION)
    return res.status(200).json({ success: true, message: "Label Created" });
};

module.exports = 
{
   AddLable,
   ResetHWID,
   ResetPassword,
   RedeemKey,
   AdminCreateUser,
   AdminEditUser,
   GetUserStats,
   UserAuth,
   LoginHandler,
   RegisterHandler
};