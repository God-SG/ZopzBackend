
function parse(raw) 
{
  let data;
  try 
  {
    data = JSON.parse(raw);
  } 
  catch { }
  return data;
}

module.exports = { parse };