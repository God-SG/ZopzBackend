const fs = require('fs');

function loadKeys(path) 
{
  try 
  {
    return JSON.parse(fs.readFileSync(path));
  } 
  catch 
  {
    return {};
  }
}

function saveKeys(path, keys) 
{
  fs.writeFileSync(path, JSON.stringify(keys, null, 2));
}

module.exports = { loadKeys, saveKeys };