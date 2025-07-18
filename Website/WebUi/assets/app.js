function dateAdd(date, interval, units) {
    if(!(date instanceof Date))
        return undefined;
    var ret = new Date(date); //don't change original date
    var checkRollover = function() { if(ret.getDate() !== date.getDate()) ret.setDate(0);};
    switch(String(interval).toLowerCase()) {
        case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
        case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
        case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
        case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
        case 'day'    :  ret.setDate(ret.getDate() + units);  break;
        case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
        case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
        case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
        default       :  ret = undefined;  break;
    }
    return ret;
}

function parseDatetimeString(datetimeString) {
    console.log('Original datetime string:', datetimeString);

    const parts = datetimeString.split(/[ T\.:-]/);

    console.log('Parsed parts:', parts);

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JavaScript
    const day = parseInt(parts[2], 10);
    const hours = parseInt(parts[3], 10);
    const minutes = parseInt(parts[4], 10);
    const seconds = parseInt(parts[5], 10);
    const microseconds = parseInt(parts[6], 10) || 0; // Default to 0 if microseconds are not present
    const offsetMinutes = parseInt(parts[7], 10) || 0;

    console.log('Parsed components:', {
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        microseconds,
        offsetMinutes
    });

    const utcDate = Date.UTC(year, month, day, hours, minutes, seconds, microseconds / 1000);

    console.log('UTC date before adjusting for timezone offset:', new Date(utcDate).toISOString());

    // Adjust for timezone offset
    const offsetMilliseconds = offsetMinutes * 60 * 1000;
    const localDate = new Date(utcDate - offsetMilliseconds);

    console.log('Final parsed date:', localDate.toISOString());

    return localDate;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}