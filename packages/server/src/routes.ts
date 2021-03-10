import { Application } from 'express';
import uniswapRouter from './api/controllers/uniswap';
export default function routes(app: Application): void {
    app.get('/api/v1/healthcheck', (req, res) => {
        res.send('alive');
    });
    
    app.use('/api/v1/uniswap', uniswapRouter);
}
