const Logger = require('./Logger.js');

module.exports = class Render 
{
    constructor(debug = false) 
    {
        this.debug = debug;
    }

    logRequest(req) 
    {
        if (this.debug) 
        {
            Logger.Log(`Request - Method: ${req.method}, Path: ${req.originalUrl}`);
            Logger.Log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
            if (Object.keys(req.body).length > 0) 
            {
                Logger.Log(`Body: ${JSON.stringify(req.body, null, 2)}`);
            }
        }
    }

    renderPage(page) 
    {
        return async (req, res) => 
        {
            try 
            {
                this.logRequest(req);
                return res.render(`${page}/index.ejs`);
            } 
            catch (error) 
            {
                Logger.Log(`Error rendering page ${path}:${error}}`);
                return res.status(500).render('Error/index.ejs', { errorMessage: 'Internal Server Error' });
            }
        };
    }

    renderPagewithPath(path) 
    {
        return async (req, res) => 
        {
            try 
            {
                this.logRequest(req);
                return res.render(path);
            } 
            catch (error) 
            {
                Logger.Log(`Error rendering page ${path}:${error}}`);
                return res.status(500).render('Error/index.ejs', { errorMessage: 'Internal Server Error' });
            }
        };
    }

    renderPageManual(path, varables) 
    {
        return async (req, res) => 
        {
            try 
            {
                this.logRequest(req);
                return res.render(path, varables);
            } 
            catch (error) 
            {
                Logger.Log(`Error rendering page ${path}:${error}}`);
                return res.status(500).render('Error/index.ejs', { errorMessage: 'Internal Server Error' });
            }
        };
    }

    renderIfAuthenticated = (req, res, viewPath, extraData = {}) => 
    {
        try 
        {
            this.logRequest(req);
            if (req.session?.user?.username) 
            {
                return res.render(viewPath, extraData);
            }
            return res.redirect('/');
        }
        catch (error) 
        {
            Logger.Log(`Error rendering page ${viewPath}:${error}}`);
            return res.status(500).render('Error/index.ejs', { errorMessage: 'Internal Server Error' });
        }
    };

    renderPageWithError(page) 
    {
        return async (err, req, res, next) => 
        {
            this.logRequest(req);
            Logger.Log(`Error in ${page} page:${err}`);
            return res.status(403).render(`${page}/index.ejs`, { errorMessage: err.message || 'An error occurred.' });
        };
    }

    renderTurnstileError(res, message) 
    {
        if (this.debug) 
        {
            Logger.Log(`Turnstile Error - Message: ${message}`);
        }
        return res.status(403).json({ errorMessage: message });
    }
};
