import 'common/env';
import Server from 'common/server';
import WebsocketServer from 'ws/server';
import routes from 'routes';

const port = parseInt(process.env.PORT);

const server = new Server().router(routes);
server.listen(port);

const wsServer = new WebsocketServer(server.httpServer);

export default Server;
