import dotenv from 'dotenv';
dotenv.config();

import Mixpanel from 'mixpanel';
let mixpanel: Mixpanel.Mixpanel;
import fetch from 'node-fetch';

const MS_PER_MINUTE = 60000;
const key = 'freekey';

const ADD_LIQUIDITY_ADDR = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const REMOVE_LIQUIDITY_ADDR = '0x418915329226AE7fCcB20A2354BbbF0F6c22Bd92';
const ADD_2 = '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7';
const ADD_3 = '0xE76427463FdBacdD0e794e5Ea30269f30Dd9B8eB';
const REMOVE_2 = '0x430f33353490b256D2fD7bBD9DaDF3BB7f905E78';

const CURVE_ADD = '0x6fC92B10f8f3b2247CbAbF5843F9499719b0653C';
const CURVE_REMOVE = '0xb833600aEbcC3FAb87d0116a8b1716f2a335bB95';


const SUSHI_ADD = '0xe5826517134241278b6D372D1dA9f66D07190612';
const SUSHI_REMOVE = '0x972b0Ff06c7c8e03468d841973cBB3578b6a7299';

const BALANCER = '0xe05b4871fDB9eAC749f4B809f600B74dF5B2b118';

if (key == 'freekey') {
  console.log('Limited results without official ethplorer key.');
}


if (process.env.MIXPANEL_TOKEN) {
  mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, { secret: process.env.MIXPANEL_SECRET });
} else {
  throw new Error(`Cannot start il alerts mixpanel liquidity bot without mixpanel token.`);
}

interface AddressTransaction {
  timeStamp: number;
  from: string;
  to: string;
  hash: string;
  value: number;
  input: string;
  isError: number;
}

interface TransactionReceipt {
  address: string;
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function delayed(): Promise<void> {
  //console.log("start delay");
  await sleep(1000);
  //console.log("finish delay");
}

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const DEPOSIT_TOPIC = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c';

async function getTransactionReceipt(addressTransaction: AddressTransaction, transactionType:string): Promise<void> {
  const hash = addressTransaction.hash;
  const addPath ='https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=';
  const fullPath = `${addPath}${hash}&apikey=IZNB85YKY98JT493NIY8UB682RABFBAU7P`;


  const res = await fetch(fullPath);
  let volume = 0;
  let us_val = 0;
  let coin_val = 0;

  if (res.ok) {
    const data = await res.json();
    //console.log(data);

    for (var transactionReceipt of data.result.logs) {
      if (transactionReceipt.topics.includes(TRANSFER_TOPIC) || transactionReceipt.topics.includes(DEPOSIT_TOPIC)) {
        coin_val = parseInt(transactionReceipt.data);
        us_val = coin_val; // do a conversion here to us dollars
        volume += us_val;
      }
    }
    // data.result.logs.forEach((transactionReceipt: TransactionReceipt) => {
    //   console.log("_______________");
    //   console.log(transactionReceipt);
    //   console.log("_______________");
    // });
  }

  const isError = (addressTransaction.isError == 1)
  const txTimestamp = new Date(addressTransaction.timeStamp * 1000);
  const intTimestamp = Number(txTimestamp.getTime());

  let mixpanelData = {
    distinct_id: addressTransaction.from,
    time: Number(intTimestamp / 1000),
    timestamp: txTimestamp.toISOString(),
    to: addressTransaction.to,
    from: addressTransaction.from,
    hash: addressTransaction.hash,
    volume: volume / 1000000000000000000,
    success: !isError
  }

  console.log("****************");
  console.log(mixpanelData);
  console.log("****************");
  
  mixpanel.import(`Uniswap:Volume:Test:${transactionType}`,addressTransaction.timeStamp,  mixpanelData);
}

async function getTransactionData(transactionType: string, hash: string): Promise<void> {
  const oneHoursBefore = Date.now() - (MS_PER_MINUTE * 70 );

  const addPath ='https://api.etherscan.io/api?module=account&action=txlist&address=';
  const fullPath = `${addPath}${hash}&apikey=IZNB85YKY98JT493NIY8UB682RABFBAU7P`;

  //console.log('** ETHPLORER PATH **');
  //console.log(fullPath);
  const res = await fetch(fullPath);
  const intOneHour = Number(oneHoursBefore);

  if (res.ok) {
    //console.log('** START TIME FOR COLLECTING TRANSACTIONS **');
    //console.log(intOneHour);

    const data = await res.json();
    //console.log('** TRANSACTION TIMES **');

    for (var addressTransaction of data.result) {
      const txTimestamp = new Date(addressTransaction.timeStamp * 1000);
      const intTimestamp = Number(txTimestamp.getTime());

      // if(intTimestamp > intOneHour) {
      await getTransactionReceipt(addressTransaction, transactionType);
      await delayed();
      // }
      //console.log(addressTransaction);
    }


    //   // if(intTimestamp > intOneHour) {
    //   //   console.log('^^^ ADDED ^^^');
    //   //
    //   // }
    // });
    //console.log('^^ TRANSACTION TIMES ^^');
  }
  else {
    console.log('** ERROR RESPONSE **');
    console.log(res.statusText);
    console.log('^^ ERROR RESPONSE ^^');
  }
}

export default async function getTransactionDataForMixpanel(): Promise<void> {
  await getTransactionData('LiquidityAdd', ADD_LIQUIDITY_ADDR);
  await delayed();
  await getTransactionData('LiquidityAdd', ADD_2);
  await delayed();
  await getTransactionData('LiquidityAdd', ADD_3);
  await delayed();
  await getTransactionData('LiquidityAdd', CURVE_ADD);
  await delayed();
  await getTransactionData('LiquidityAdd', SUSHI_ADD);
  await delayed();
  await getTransactionData('LiquidityAdd', BALANCER);
  await delayed();
}

if (require.main === module) {
  void getTransactionDataForMixpanel();
}
