const Benchmark = require('benchmark');

const regex = /^ethGas:getGasPrices/;
const start = 'ethGas:getGasPrices';

const matchingSuite = new Benchmark.Suite();
const matching = `${start}:this is a longer string but has some data`;

const nonMatchingSuite = new Benchmark.Suite();
const nonMatching = 'this string does not match at all';

(async function () {
    console.log('Starting matching suite');
    const first = new Promise((resolve) => {
        matchingSuite
            .add('RegExp.test', function () {
                regex.test(matching);
            })
            .add('String.match', function () {
                matching.match(regex);
            })
            .add('String.startsWith', function () {
                matching.startsWith(start);
            })
            .add('String.includes', function () {
                // doesn't really count
                matching.includes(start);
            })
            .on('cycle', function (event) {
                // log each test result
                console.log(String(event.target));
            })
            .on('complete', function () {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
                resolve();
            })
            // run async
            .run({ async: true });
    });

    await first;

    console.log('\nStarting non-matching suite');
    nonMatchingSuite
        .add('RegExp.test', function () {
            regex.test(nonMatching);
        })
        .add('String.match', function () {
            matching.match(nonMatching);
        })
        .add('String.startsWith', function () {
            matching.startsWith(nonMatching);
        })
        .add('String.includes', function () {
            // doesn't really count
            matching.includes(nonMatching);
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
})();
