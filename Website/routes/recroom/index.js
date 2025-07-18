const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');

const { HttpsProxyAgent } = require('https-proxy-agent');
const Logger = require('../../Logger.js');

const router = express.Router();
const proxies = fs.readFileSync('./routes/recroom/proxies.txt', 'utf-8').split(/\r?\n/).filter(proxy => proxy.trim().length > 0);

router.get('/accounts/:username', async (req, res) => {
    try {
        if (proxies.length === 0) {
            return res.status(500).json({ error: 'No proxies available' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ error: 'Invalid Request: Username required' });
        }

        const fetchResponse = await fetch(`https://apim.rec.net/accounts/account?username=${username}`, {
            method: 'GET',
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=0, i",
                "sec-ch-ua": "\"Opera GX\";v=\"116\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cookie": "__cf_bm=v5tZkRtsGCDuTMZvcCxhiu7utzNp6yCR4xw4w6OdlkI-1740364428-1.0.1.1-nqIr8gWLQOZdWyjEJRefovQYitTHpeUpkiAB9MyjyVwl34yDIKArIKisOzfvGhwSZRdQ.mcFTHR_Nuhe1AEDJw"
            },
            agent: proxyAgent
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch data' });
        }
        Logger.Log(`Fetched data for User ${username} From ${req.clientIp}`);
        const data = await fetchResponse.json();
        console.log(data);
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/apis/api/PlayerReporting/v1/internal/create', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const {PlayerIdReported, ReportCategory, Details } = req.body;

        if (!authorization || !PlayerIdReported || !ReportCategory || !Details) {
            return res.status(400).json({ error: 'Invalid Request: Missing required fields' });
        }

        const json = JSON.stringify({
            ReportCategory: ReportCategory,
            PlayerIdReported: PlayerIdReported.toString(),
            RoomId: "0",
            Details: Details
        });

        const fetchResponse = await fetch('https://apim.rec.net/apis/api/PlayerReporting/v1/internal/create', {
            method: 'POST',
            headers: {
                'authorization': `${authorization}`,
                'Content-Type': 'application/json'
            },
            body: json
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to send report' });
        }       
        const data = await fetchResponse.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/api/images/v2/:imageId/report', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const { imageId } = req.params;
        const {ReportDetails} = req.body;
        console.log(req.body);
        if (!authorization || !imageId || !ReportDetails) {
            return res.status(400).json({ error: 'Invalid Request: Missing required fields' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const json = JSON.stringify({
            ReportCategory: 1,
            ReportDetails: ""
        });

        const fetchResponse = await fetch(`https://api.rec.net/api/images/v2/${imageId}/report`, {
            method: 'POST',
            headers: {
                'authorization': `${authorization}`,
                'Content-Type': 'application/json'
            },
            body: json,
            agent: proxyAgent
        });

        if (!fetchResponse.ok) {
        
            return res.status(fetchResponse.status).json({ error: 'Failed to send report' });
        }
        const data = await fetchResponse.text();
        res.status(200).json({ message: 'Report sent successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/subscription/:userId', async (req, res) => {
    try {
        const {authorization} = req.headers;
        const userId = req.params.userId;   

        if (!authorization || !userId) {
            return res.status(400).json({ error: 'Invalid Request: Missing required fields' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const json = JSON.stringify({ userId });

        const fetchResponse = await fetch(`https://clubs.rec.net/subscription/${userId}`, {
            method: 'POST',
            headers: {
                'authorization': `${authorization}`,
                'Content-Type': 'application/json'
            },
            body: json,
            agent: proxyAgent
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to subscribe to user' });
        }
        res.status(200).json({ message: `Successfully subscribed to user ID: ${userId}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/PlayerCheer/v1/create', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const {PlayerIdTo} = req.body;
        if (!authorization || !PlayerIdTo) {
            return res.status(400).json({ error: 'Invalid Request: Missing required fields' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const json = JSON.stringify({
            CheerCategory: 10,
            PlayerIdTo
        });

        const fetchResponse = await fetch('https://api.rec.net/api/PlayerCheer/v1/create', {
            method: 'POST',
            headers: {
                'authorization': `${authorization}`,
                'Content-Type': 'application/json'
            },
            body: json,
            agent: proxyAgent
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to send cheer' });
        }
        const data = await fetchResponse.json();
        res.status(200).json({ message: `Successfully sent cheer for Player ID: ${PlayerIdTo}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/accountId/:username', async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Invalid Request: Username required' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const fetchResponse = await fetch(`https://apim.rec.net/accounts/account?username=${username}`, {
            method: 'GET',
            agent: proxyAgent
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch account ID' });
        }

        const data = await fetchResponse.json();
        res.status(200).json({ accountId: data.accountId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/relationships/v2/get', async (req, res) => 
{
    try 
    {
        const { authorization } = req.headers;
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);
        const fetchResponse = await fetch('https://api.rec.net/api/relationships/v2/get', 
        {
            method: 'GET',
            agent: proxyAgent,
            headers: 
            {
                'Authorization': `${authorization}`
            }
        });
        if (!fetchResponse.ok) 
        {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch account data' });
        }
        const data = await fetchResponse.json();
        return res.status(200).json(data);
    } 
    catch (error) 
    {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/account/bulk', async (req, res) => //Fixed by pc complex you are gey
{
    try 
    {
        const { authorization } = req.headers;
        let { id } = req.query;
        if (!id) 
        {
            return res.status(400).json({ error: 'Invalid Request: At least one ID is required' });
        }
        let idsArray = Array.isArray(id) ? id : [id];
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);
        const formData = new URLSearchParams();
        idsArray.forEach(id => formData.append('id', id));
        const fetchResponse = await fetch('https://accounts.rec.net/account/bulk', 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            agent: proxyAgent,
            headers: 
            {
                'authorization': `${authorization}`
            }
        });
        if (!fetchResponse.ok) 
        {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch bulk account info' });
        }
        const data = await fetchResponse.json();

        return res.status(200).json(data);
    } 
    catch (error) 
    {
        console.error(`Error fetching bulk account info: ${error}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/PlayerReporting/v1/moderationBlockDetails', async (req, res) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(400).json({ error: 'Invalid Request: Authorization required' });
        }
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);
        const fetchResponse = await fetch('https://api.rec.net/api/PlayerReporting/v1/moderationBlockDetails', {
            method: 'GET',
            agent: proxyAgent,
            headers: {
                'authorization': `${authorization}`
            }
        });
        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            console.log(`Failed to fetch moderation details from ${req.clientIp} with ${JSON.stringify(errorData)}`);
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch moderation details' });
        }
        const data = await fetchResponse.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/account/me', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const fetchResponse = await fetch('https://accounts.rec.net/account/me', {
            method: 'GET',
            agent: proxyAgent,
            headers: {
                'authorization': `${authorization}`
            }
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch user profile' });
        }

        const data = await fetchResponse.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/accounts/account/bio/:accountId', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const { accountId } = req.params;
        console.log(accountId);
        if (!accountId || !authorization) {
            return res.status(400).json({ error: 'Invalid Request: Account ID required' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const fetchResponse = await fetch(`https://apim.rec.net/accounts/account/${accountId}/bio`, {
            method: 'GET',
            agent: proxyAgent,
            headers: {
                'authorization': `${authorization}`
            }
        });

        if (!fetchResponse.ok) {
            console.log(fetchResponse.status);
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch player bio' });
        }
        
        const data = await fetchResponse.json();
        console.log(data);
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/account/me/bio', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const {bio} = req.body;
        if (!authorization || !bio) {
            return res.status(400).json({ error: 'Invalid Request: Missing required fields' });
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const fetchResponse = await fetch('https://accounts.rec.net/account/me/bio', {
            method: 'PUT',
            headers: {
                'authorization': `${authorization}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ bio }),
            agent: proxyAgent
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to update bio' });
        }
        const data = await fetchResponse.json();
        res.status(200).json({ message: 'Bio updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/api/relationships/v3/:accountId', async (req, res) => 
{
    try 
    {
        const { accountId } = req.params;
        const {authorization} = req.headers;
        if (!authorization || !accountId) 
        {
            return res.status(400).json({ error: 'Invalid Request: Missing required fields' });
        }
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);
        const json = JSON.stringify(
        {
            PlayerID: accountId,
            RelationshipType: 1,
            Favorited: 0,
            Muted: 0,
            Ignored: 0
        });
        const fetchResponse = await fetch(`https://api.rec.net/api/relationships/v3/${accountId}`, 
        {
            method: 'POST',
            headers: 
            {
                'authorization': `${authorization}`,
                'Content-Type': 'application/json'
            },
            body: json,
            agent: proxyAgent
        });
        
        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            return res.status(fetchResponse.status).json({ error: 'Failed to add relationship' });
        }
        res.status(200).json({ message: 'Added Relationship successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/instance/:accountId', async (req, res) => 
{
    try 
    {
        const { authorization } = req.headers;    
        const { accountId } = req.params;
        if (!accountId || !authorization)
        {
            return res.status(400).json({ error: 'Invalid Request: Account ID required ' });
        }
        //const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        //const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const fetchResponse = await fetch(`https://match.rec.net/player?id=${accountId}`, 
        {
            method: 'GET',
            //agent: proxyAgent,
            headers: 
            {
                'authorization': `${authorization}`,
                'cache-control': 'no-cache',
                'pragma': 'no-cache',
            }
        });

        if (!fetchResponse.ok) 
        {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch player instance data' });
        }

        const data = await fetchResponse.json();
        res.status(200).json(data[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/account/me/children', async (req, res) => {
    try {
        const {authorization} = req.headers;
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

        const fetchResponse = await fetch('https://accounts.rec.net/account/me/children', {
            method: 'GET',
            agent: proxyAgent,
            headers: {
                'authorization': `${authorization}`
            }
        });

        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ error: 'Failed to fetch children account info' });
        }

        const data = await fetchResponse.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;