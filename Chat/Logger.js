const COLORS = 
{
    RESET: '\x1b[0m',
    GREY: '\x1b[90m',
    WHITE: '\x1b[37m',
    RED: '\x1b[31m',
};

function Log(message) 
{
    Write('[', COLORS.GREY);
    Write(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), COLORS.RED)
    Write(']: ', COLORS.GREY);
    WriteLine(message, COLORS.RED);
}

function LogModule(message, module) 
{
    Write('[', COLORS.GREY);
    Write(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), COLORS.RED)
    Write(']', COLORS.GREY);
    Write('[', COLORS.GREY);
    Write(module, COLORS.RED);
    Write(']: ', COLORS.GREY);
    WriteLine(message, COLORS.RED);
}

function Write(message, color) 
{
    process.stdout.write(`${color}${message}${COLORS.RESET}`);
}

function WriteLine(message, color) 
{
    Write(`${message}\n`, color);
}

module.exports = 
{
    Log,
    LogModule,
    Write,
    WriteLine,
    COLORS
}