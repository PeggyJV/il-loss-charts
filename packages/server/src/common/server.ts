import express, { Application } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import cookieParser from 'cookie-parser';
import pino from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import l from './logger';

import errorHandler from '../api/middlewares/error.handler';
import * as OpenApiValidator from 'express-openapi-validator';

const app = express();

export default class ExpressServer {
    public httpServer?: http.Server;

    constructor() {
        const root = path.normalize(__dirname + '/../..');
        const clientRoot = path.normalize(__dirname + '/../../../client');
        app.set('appPath', root + 'client');

        app.use(
            pino({
                logger: l,
            })
        );

        app.use(
            bodyParser.json({ limit: process.env.REQUEST_LIMIT || '100kb' })
        );
        app.use(
            bodyParser.urlencoded({
                extended: true,
                limit: process.env.REQUEST_LIMIT || '100kb',
            })
        );
        app.use(
            bodyParser.text({ limit: process.env.REQUEST_LIMIT || '100kb' })
        );
        app.use(cookieParser(process.env.SESSION_SECRET));
        app.use(express.static(`${root}/public`));
        app.use(express.static(`${clientRoot}/build`));

        const apiSpec = path.join(__dirname, '../docs/api.yml');
        const validateResponses = !!(
            process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
            process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === 'true'
        );
        const apiDoc = YAML.load(apiSpec);

        app.use('/api/explorer', swaggerUi.serve, swaggerUi.setup(apiDoc));

        // TODO re-enable
        app.use(
            OpenApiValidator.middleware({
                apiSpec,
                validateRequests: false,
                validateResponses,
                ignorePaths: /.*\/spec(\/|$)/,
            })
        );

        // Catch all
        app.use(function (req, res, next) {
            if (req.url.includes('api')) return next();

            console.log('SERVING APP');

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
            l.info(
                `up and running in ${process.env.NODE_ENV || 'development'
                } @: ${os.hostname()} on port: ${p}}`
            );

        this.httpServer = http.createServer(app).listen(port, welcome(port));

        return app;
    }
}
