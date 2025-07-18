const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const base64js = require('base64-js');
const argon2 = require('argon2');

const agent = new https.Agent(
{
    rejectUnauthorized: true
}); 

async function get(url, headers)
{
    const response = await axios.get(url, 
    {
        headers: headers,
        httpsAgent: agent,
        validateStatus: function (status) 
        {
            return true; 
        }
    });
    return response; 
}

async function post(url, data, headers)
{
    const response = await axios.post(url, data, 
    {
        headers: headers,
        httpsAgent: agent,
        validateStatus: function (status) 
        {
            return true; 
        }
    });
    return response; 
}

function generateRandomString(length) 
{
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) 
    {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateHMAC512(secret, payload) 
{
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

function xorEncrypt(input, key) 
{
  let output = '';
  const keyLength = key.length;
  for (let i = 0; i < input.length; i++) 
  {
    output += String.fromCharCode(input.charCodeAt(i) ^ key[i % keyLength]);
  }
  const encodedOutput = new TextEncoder().encode(output);
  return base64js.fromByteArray(encodedOutput);
}

function xorDecrypt(encoded, key) 
{
  try 
  {
    const encrypted = base64js.toByteArray(encoded);
    let output = '';
    const keyLength = key.length;
    for (let i = 0; i < encrypted.length; i++) 
    {
      output += String.fromCharCode(encrypted[i] ^ key[i % keyLength]);
    }
    return output;
  } 
  catch (err) 
  {
    throw new Error(`Failed to decode Base64: ${err.message}`);
  }
}

async function hash(str) 
{
  return await argon2.hash(str);
}

async function verifyPassword(hashedPassword, password)
{
  return await argon2.verify(hashedPassword, password);
}

module.exports = 
{
    get,
    post,
    hash,
    generateRandomString,
    xorEncrypt,
    xorDecrypt,
    generateHMAC512,
    verifyPassword
}