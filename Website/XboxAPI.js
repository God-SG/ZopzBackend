const fetch = require('node-fetch');
const express = require('express');

const router = express.Router();

//get profile endpoint
router.get('/xbox/get-profile', async (req, res) => 
{
    const token = req.headers['authorization'];
    if (!token) 
    {
        return res.status(400).json({ error: 'token is required' });
    }
    const userResponse = await fetch(`https://profile.xboxlive.com/users/me/profile/settings?settings=Gamertag`,
    {
        method: 'GET',
        headers: 
        {

            'authorization': token,
            'x-xbl-contract-version': '2'
        }
    });
    const data = await userResponse.json();
    if (userResponse.status !== 200) 
    {
        const errorData = await userResponse.text();
        return res.status(userResponse.status).send(errorData);
    }
    return res.status(200).json(data);
});

router.post('/api/xbox/party/get', async (req, res) => 
{
    const { xuid, token } = req.body;
    if (!xuid) 
    {
        return res.status(400).json({ success: false, message: `xuid is required` });
    }
    if (!token) 
    {
        return res.status(400).json({ success: false, message: `token is required` });
    }
    const sessionResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions?xuid=${xuid}&followed=true`,
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    let sessionData = await sessionResponse.json();
    if (!sessionData.results?.length) 
    {
        return res.status(402).json({ success: false, message: 'Not in party' });
    }
    const partySession = sessionData.results[0]?.sessionRef?.name;
    if (!partySession) 
    {
        return res.status(402).json({ success: false, message: 'Invalid party session data' });
    }
    const membersResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions/${partySession}`, 
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    sessionData = await membersResponse.json();
    if (membersResponse.status !== 200) 
    {
        return res.status(402).json({ success: false, message: 'Failed to grab party' });
    }
    return res.status(200).json({ success: true, message: 'Data Grabbed', data: sessionData });
});
//unkickable endpoint
router.post('/api/xbox/party/nokick/', async (req, res) =>
{
    const { xuid, token } = req.body;
    if (!xuid) 
    {
        return res.status(400).json({ success: false, message: `xuid is required` });
    }
    if (!token) 
    {
        return res.status(400).json({ success: false, message: `token is required` });
    }
    const sessionResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions?xuid=${xuid}&followed=true`,
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    let sessionData = await sessionResponse.json();
    if (!sessionData.results?.length) 
    {
        return res.status(402).json({ success: false, message: 'Not in party' });
    }
    const { sessionRef, firstMemberXuid } = sessionData.results[0];
    const partySession = sessionRef.name;
    const hostLeaderXUID = firstMemberXuid;
    const membersResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions/${partySession}`, 
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    sessionData = await membersResponse.json();
    const hostMember = Object.values(sessionData.members).find(member => member.constants.system.xuid === hostLeaderXUID);
    if (!hostMember) 
    {
        return res.status(402).json(
        {
            success: false,
            message: `Host leader not found in party members`
        });
    }
    const hostConID = hostMember.properties.system.connection;
    const hostSubID = hostMember.properties.system.subscription.id;
    const updateData = 
    {
        members: 
        {
            me: 
            {
                properties: 
                {
                    system: 
                    {
                        active: true,
                        connection: hostConID,
                        subscription: 
                        {
                            changeTypes: 
                            [
                                'host', 'initialization', 'memberslist', 'membersstatus',
                                'customproperty', 'memberscustomproperty', 'joinability',
                                'cloudcompute', 'membersonly',
                            ],
                            id: hostSubID,
                        }
                    }
                }
            }
        }
    };
    const updateResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions/${partySession}`,
    {
        method: 'PUT', 
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        },
        body: JSON.stringify(updateData)
    });
    if (updateResponse.status !== 200) 
    {
        return res.status(402).json({ success: false, message: 'Failed to set unkickable' });
    }
    return res.status(200).json({ success: true, message: 'You are now unkickable.' });
});
//crash host endpoint
router.post('/api/xbox/party/hostcrash/', async (req, res) => 
{
    const { xuid, token } = req.body;
    if (!xuid) 
    {
        return res.status(400).json({ success: false, message: `xuid is required` });
    }
    if (!token) 
    {
        return res.status(400).json({ success: false, message: `token is required` });
    }
    const sessionResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions?xuid=${xuid}&followed=true`,
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    let sessionData = await sessionResponse.json();
    if (!sessionData.results?.length) 
    {
        return res.status(402).json({ success: false, message: 'Not in party' });
    }
    const partySession = sessionData.results[0]?.sessionRef?.name;
    if (!partySession) 
    {
        return res.status(402).json({ success: false, message: 'Invalid party session data' });
    }
    const updateData = 
    {
        properties: 
        {
            system: 
            {
                joinRestriction: 'local',
                readRestriction: 'local'
            }
        }
    };
    const updateResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions/${partySession}`,
    {
        method: 'PUT', 
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        },
        body: JSON.stringify(updateData)
    });
    if (updateResponse.status !== 200) 
    {
        return res.status(402).json({ success: false, message: 'Failed to crash host' });
    }
    return res.status(200).json({ success: true, message: 'Crashed Host!!!' });
});


//open party endpoint
router.post('/api/xbox/party/open/', async (req, res) => 
{
    const { xuid, token } = req.body;
    if (!xuid) 
    {
        return res.status(400).json({ success: false, message: `xuid is required` });
    }
    if (!token) 
    {
        return res.status(400).json({ success: false, message: `token is required` });
    }
    const sessionResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions?xuid=${xuid}&followed=true`,
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    let sessionData = await sessionResponse.json();
    if (!sessionData.results?.length) 
    {
        return res.status(402).json({ success: false, message: 'Not in party' });
    }
    const partySession = sessionData.results[0]?.sessionRef?.name;
    if (!partySession) 
    {
        return res.status(402).json({ success: false, message: 'Invalid party session data' });
    }
    const updateData = 
    {
        properties: 
        {
            system: 
            {
                closed: false,
                joinRestriction: 'followed'
            }
        }
    };
    const updateResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions/${partySession}`,
    {
        method: 'PUT', 
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        },
        body: JSON.stringify(updateData)
    });
    if (updateResponse.status !== 200) 
    {
        return res.status(402).json({ success: false, message: 'Failed to open party' });
    }
    return res.status(200).json({ success: true, message: 'Opened Party!!!' });
});
//close party endpoint
router.post('/api/xbox/party/close/', async (req, res) => 
{
    const { xuid, token } = req.body;
    if (!xuid) 
    {
        return res.status(400).json({ success: false, message: `xuid is required` });
    }
    if (!token) 
    {
        return res.status(400).json({ success: false, message: `token is required` });
    }
    const sessionResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions?xuid=${xuid}&followed=true`,
    {
        method: 'GET',
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        }
    });
    let sessionData = await sessionResponse.json();
    if (!sessionData.results?.length) 
    {
        return res.status(402).json({ success: false, message: 'Not in party' });
    }
    const partySession = sessionData.results[0]?.sessionRef?.name;
    if (!partySession) 
    {
        return res.status(402).json({ success: false, message: 'Invalid party session data' });
    }
    const updateData = 
    {
        properties: 
        {
            system: 
            {
                closed: true,
                joinRestriction: 'local'
            }
        }
    };
    const updateResponse = await fetch(`https://party.xboxlive.com/serviceconfigs/7492BACA-C1B4-440D-A391-B7EF364A8D40/sessiontemplates/chat/sessions/${partySession}`,
    {
        method: 'PUT', 
        headers: 
        {
            'accept': '*/*',
            'accept-Language': 'en-US',
            'authorization': token,
            'content-type': 'application/json; charset=utf-8',
            'user-agent': 'XBL-xComms-Win/1.0.0',
            'x-xbl-contract-version': '107',
            'accept-encoding': 'gzip, deflate, br'
        },
        body: JSON.stringify(updateData)
    });
    if (updateResponse.status !== 200) 
    {
        return res.status(402).json({ success: false, message: 'Failed to close party' });
    }
    return res.status(200).json({ success: true, message: 'Closed Party!!!'});
});

module.exports = router;