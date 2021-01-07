import { Application } from 'express';
import uniswapRouter from './api/controllers/uniswap';
export default function routes(app: Application): void {
    app.use('/api/v1/uniswap', uniswapRouter);
}

