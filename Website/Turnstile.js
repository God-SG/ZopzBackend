require('dotenv').config();
const Utils = require('./Utils.js');
const Logger = require('./Logger.js');

module.exports = class Turnstile // For if you want this later just let me know zopz when you have the $. PcPrincipal
{
    constructor(debug = false) 
    {
        this.debug = debug;
    }

    async verifyCaptcha(token) 
    {
        try 
        {
            if (this.debug) 
            {
                Logger.Log(`Verifying Captcha with token: ${token}`);
            }
            const response = await Utils.post('https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                secret: process.env.CLOUDFLARE_SECRET,
                response: token
            },
            {
                headers: 
                {
                    'Content-Type': 'application/json'
                }
            });
            if (this.debug) 
            {
                Logger.Log(`Captcha verification response: ${JSON.stringify(response.data)}`);
            }
            return response.data.success;
        } 
        catch (error) 
        {
            Logger.Log(`Captcha verification failed: ${error}`);
            return false;
        }
    }
};