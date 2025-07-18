const colors = 
{
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

function log(msg, color = 'reset') 
{
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${msg}${colors.reset}`);
}

module.exports = { log , colors};