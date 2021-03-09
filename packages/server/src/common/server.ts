import express, { Application } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import Mixpanel from 'mixpanel';

import errorHandler from '../api/middlewares/error.handler';
import * as OpenApiValidator from 'express-openapi-validator';

import config from 'config';

let mixpanel: Mixpanel.Mixpanel;

if (process.env.MIXPANEL_TOKEN) {
    mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);
}

const app = express();
export default class ExpressServer {
    public httpServer?: http.Server;

    constructor() {
        const root = path.normalize(__dirname + '/../..');
        const clientRoot = path.normalize(__dirname + '/../../../client');
        app.set('appPath', root + 'client');

        app.use(morgan('dev'));

        app.use(
            bodyParser.json({ limit: config.requestLimit })
        );
        app.use(
            bodyParser.urlencoded({
                extended: true,
                limit: config.requestLimit,
            })
        );
        app.use(
            bodyParser.text({ limit: config.requestLimit })
        );
        app.use(cookieParser(process.env.SESSION_SECRET));
        app.use(express.static(`${root}/public`));
        app.use(express.static(`${clientRoot}/build`));

        const apiSpec = path.join(__dirname, '../docs/api.yml');
        const validateResponses = config.enableResponseValidation;
        const apiDoc = YAML.load(apiSpec);

        app.use('/api/explorer', swaggerUi.serve, swaggerUi.setup(apiDoc));
        app.use(config.openApiSpec, express.static(apiSpec));

        app.use(
            OpenApiValidator.middleware({
                apiSpec,
                validateRequests: true,
                validateResponses,
                ignorePaths: /.*\/spec(\/|$)/,
            })
        );

        // Catch all
        app.use(function (req, res, next) {
            if (req.url.includes('api')) return next();

            mixpanel?.track('server:page_load', { ip: req.ip });

            res.sendFile(path.join(clientRoot, 'build', 'index.html'));
        });
    }

    router(routes: (app: Application) => void): ExpressServer {
        routes(app);
        app.use(errorHandler);
        return this;
    }

    listen(port: number): Application {
        const welcome = (p: number) => (): void =>
            console.info(
                `${new Date().toISOString()} up and running in ${
                    process.env.NODE_ENV || 'development'
                } @: ${os.hostname()} on port: ${p}`
            );

        this.httpServer = http.createServer(app).listen(port, welcome(port));

        return app;
    }
}
