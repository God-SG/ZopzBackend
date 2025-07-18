const COLORS = 
{
    RESET: '\x1b[0m',
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    GREY: '\x1b[90m',
    BRIGHT_RED: '\x1b[91m',
    BRIGHT_GREEN: '\x1b[92m',
    BRIGHT_YELLOW: '\x1b[93m',
    BRIGHT_BLUE: '\x1b[94m',
    BRIGHT_MAGENTA: '\x1b[95m',
    BRIGHT_CYAN: '\x1b[96m',
    BRIGHT_WHITE: '\x1b[97m'
};

function getTimeStamp() 
{
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Log(message, color = COLORS.WHITE) 
{
    Write(`[`, COLORS.GREY);
    Write(getTimeStamp(), COLORS.RED);
    Write(`]`, COLORS.GREY);
    Write(': ', COLORS.GREY);
    WriteLine(message, color);
}

function LogModule(message, module, color = COLORS.WHITE) 
{
    Write(`[`, COLORS.GREY);
    Write(getTimeStamp(), COLORS.RED);
    Write(`]`, COLORS.GREY);
    Write(`[`, COLORS.GREY);
    Write(module, COLORS.GREY);
    Write(`]`, COLORS.GREY);
    Write(': ', COLORS.GREY);
    WriteLine(message, color);
}

function WriteLine(message, color = COLORS.WHITE) 
{
    Write(`${message}\n`, color);
}

function Write(message, color = COLORS.WHITE) 
{
    process.stdout.write(`${color}${message}${COLORS.RESET}`);
}

function Clear() 
{
    process.stdout.write('\x1Bc');
}

module.exports = 
{
    COLORS,
    Clear,
    Log,
    LogModule
};