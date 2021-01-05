const API_ROOT = `http://localhost:3001`;

async function runAlertCheck() {
    // Every hour, fetch latest market data for top pairs - runs locally so using localhost
    // For any pair with a 10% 24h change in impermanent loss, send an alert



}


if (require.main === module) {
    runAlertCheck();
}