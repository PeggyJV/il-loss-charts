import dotenv from 'dotenv';
dotenv.config();

import Mixpanel from 'mixpanel';
let mixpanel: Mixpanel.Mixpanel;

import * as superagent from 'superagent'

var MS_PER_MINUTE = 60000;
var key = process.env.ETHPLORER_KEY || 'freekey'

if (key == 'freekey') {
  console.log('Limited results without official ethplorer key.')
}

if (process.env.MIXPANEL_TOKEN) {
    mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);
} else {
    throw new Error(`Cannot start il alerts mixpanel liquidity bot without mixpanel token.`);
}

var oneHoursBefore = Date.now() - (MS_PER_MINUTE * 60);

superagent.get('https://api.ethplorer.io/getAddressTransactions/0xFd8A61F94604aeD5977B31930b48f1a94ff3a195')
.query({ apiKey: key, limit: '200', timestamp: oneHoursBefore  })
.end((err, res) => {
  if (err) { return console.log(err); }

  res.body.forEach(function (item: any) {

    mixpanel.track('UniswapLiquidity:add', {
      distinct_id: item.from,
      timestamp: item.timestamp,
      to: item.to,
      from: item.from,
      hash: item.hash,
      value: item.value,
      success: item.success
    });
  });
});


superagent.get('https://api.ethplorer.io/getAddressTransactions/0x418915329226AE7fCcB20A2354BbbF0F6c22Bd92')
.query({ apiKey: key, limit: '200', timestamp: oneHoursBefore  })
.end((err, res) => {
  if (err) { return console.log(err); }

  res.body.forEach(function (item: any) {

    mixpanel.track('UniswapLiquidity:remove', {
      distinct_id: item.from,
      timestamp: item.timestamp,
      to: item.to,
      from: item.from,
      hash: item.hash,
      value: item.value,
      success: item.success
    });
  });
});
