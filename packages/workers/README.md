# Sommelier Workers
## mainnet-cache-warmer
Keeps Redis cache warm so requests are always fast for clients. Configured warmers:
- GET /api/v1/mainnet/pools

### DotEnv Configuration
env : type : default value
- `V3_SUBGRAPH_URL` : `string` : `rinkeby subgraph` - Uniswap V3 mainnet subgraph URL
- `REDIS_URL` : `string` : `127.0.0.1` - Target Redis instance host
- `REDIS_PORT` : `number` : `6379` - Target Redis instance port
- `REDIS_DB` : `number` : `0` - Target redis DB

#### Get Top Pools Configuration
- `MAX_RETRY_TOP_POOLS` : `number` : `5` - Number of times to retry fetching top pools from subgraph
- `CACHE_TIMEOUT_TOP_POOLS` : `number` : `6 minutes` - Cache timeout for top pools query in ms