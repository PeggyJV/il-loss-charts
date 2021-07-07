import { Application } from 'express';
import uniswapRouter from './api/controllers/uniswap';
import poolsRouter from './api/controllers/pools';
import positionsRouter from './api/controllers/positions';
import marketDataRouter from './api/controllers/market-data';

export default function routes(app: Application): void {
    app.get('/api/v1/healthcheck', (req, res) => {
        res.send('alive');
    });

    app.use('/api/v1/uniswap', uniswapRouter);
    app.use('/api/v1/marketData', marketDataRouter);
    app.use('/api/v1', poolsRouter);
    app.use('/api/v1', positionsRouter);
}
