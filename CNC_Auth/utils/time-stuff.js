
function IsExpired(user) 
{
    const [month, day, year] = user.subscription_expiry.split('/').map(Number);
    const expiryDate = new Date(year, month - 1, day); 
    const currentDate = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    if (expiryDate < currentDate)
    {
        return true;
    }
    return false;
}

module.exports = { IsExpired };