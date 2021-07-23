const Benchmark = require('benchmark');
const BigNumber = require('bignumber.js');

const suite = new Benchmark.Suite();

const pools = [];
for (let i = 0; i < 1000; i++) {
    pools.push({
        volumeUSD: randomVol(),
    });
}

const poolsConverted = pools.map((p) => ({ volumeUSD: new BigNumber(p) }));

suite
    .add('1000 items: convert to BigNum and sort by volumeUSD', function () {
        pools.sort((a, b) => {
            const volA = new BigNumber(a.volumeUSD);
            const volB = new BigNumber(b.volumeUSD);

            return sortBigNum({ volumeUSD: volA }, { volumeUSD: volB });
        });
    })
    .add('1000 items: pre-convert, then sort by volumeUSD', function () {
        poolsConverted.sort(sortBigNum);
    })
    .add('50 items: convert to BigNum and sort by volumeUSD', function () {
        pools.sort((a, b) => {
            const volA = new BigNumber(a.volumeUSD);
            const volB = new BigNumber(b.volumeUSD);

            return sortBigNum({ volumeUSD: volA }, { volumeUSD: volB });
        });
    })
    .add('50 items: pre-convert, then sort by volumeUSD', function () {
        poolsConverted.sort(sortBigNum);
    })
    .on('cycle', function (event) {
        // log each test result
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run({ async: true });

function randomVol() {
    const min = 100000;
    return Math.random() * (Number.MAX_SAFE_INTEGER - min) + min;
}

function sortBigNum(a, b) {
    return b.volumeUSD.comparedTo(a.volumeUSD);
}
