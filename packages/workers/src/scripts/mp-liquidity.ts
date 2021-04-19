import dotenv from 'dotenv';
dotenv.config();

import Mixpanel from 'mixpanel';
let mixpanel: Mixpanel.Mixpanel;
import fetch from 'node-fetch';

const MS_PER_MINUTE = 60000;
const key = 'freekey';

const ADD_LIQUIDITY_ADDR = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const REMOVE_LIQUIDITY_ADDR = '0x418915329226AE7fCcB20A2354BbbF0F6c22Bd92';

const ADD_LIQUIDITY_V2_ADDR = '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7';
const REMOVE_LIQUIDITY_V2_ADDR = '0x430f33353490b256D2fD7bBD9DaDF3BB7f905E78';

const CURVE_ADD_ADDR = '0x6fC92B10f8f3b2247CbAbF5843F9499719b0653C';
const CURVE_REMOVE_ADDR = '0xb833600aEbcC3FAb87d0116a8b1716f2a335bB95';


const SUSHI_ADD_ADDR = '0xe5826517134241278b6D372D1dA9f66D07190612';
const SUSHI_REMOVE_ADDR = '0x972b0Ff06c7c8e03468d841973cBB3578b6a7299';

const BALANCER_ADDR = '0xe05b4871fDB9eAC749f4B809f600B74dF5B2b118';



if (key == 'freekey') {
  console.log('Limited results without official ethplorer key.');
}


if (process.env.MIXPANEL_TOKEN) {
    mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, { secret: process.env.MIXPANEL_SECRET });
} else {
    throw new Error(`Cannot start il alerts mixpanel liquidity bot without mixpanel token.`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function delayed() {
  console.log("start delay");
  await sleep(4000);
  console.log("finish delay");
}

interface AddressTransaction {
  timeStamp: number;
  from: string;
  to: string;
  hash: string;
  value: number;
  input: string;
  success: boolean;
}

async function getTransactionData(transactionType: string, hash: string): Promise<void> {
  const oneHoursBefore = Date.now() - (MS_PER_MINUTE * 60 * 22);


  const addPath ='https://api.etherscan.io/api?module=account&action=txlist&address=';
  const fullPath = `${addPath}${hash}&apikey=IZNB85YKY98JT493NIY8UB682RABFBAU7P`;

  console.log('** ETHPLORER PATH **');
  console.log(fullPath);
  const res = await fetch(fullPath);
  // const data = await res.json();
  // console.log(data);

if (res.ok) {
    console.log('** START TIME FOR COLLECTING TRANSACTIONS **');
    console.log(oneHoursBefore);

    const data = await res.json();

    console.log('** TRANSACTION TIMES **');
    data.result.forEach((addressTransaction: AddressTransaction) => {
      const txTimestamp = new Date(addressTransaction.timeStamp * 1000);

      console.log(txTimestamp.getTime(), addressTransaction.hash);

      if(txTimestamp.getTime() > oneHoursBefore) {
        mixpanel.import(`Uniswap:${transactionType}`,addressTransaction.timeStamp,  {
          distinct_id: addressTransaction.from,
          time: addressTransaction.timeStamp,
          timestamp: txTimestamp.toISOString(),
          to: addressTransaction.to,
          from: addressTransaction.from,
          hash: addressTransaction.hash,
          value: addressTransaction.value,
          success: addressTransaction.success
        });
      }
    });
    console.log('^^ TRANSACTION TIMES ^^');
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

  await getTransactionData('LiquidityAdd', ADD_LIQUIDITY_V2_ADDR);
  await delayed();
  await getTransactionData('LiquidityAdd', CURVE_ADD_ADDR);
  await delayed();

  await getTransactionData('LiquidityAdd', SUSHI_ADD_ADDR);
  await delayed();

  await  getTransactionData('LiquidityAdd', BALANCER_ADDR);
  await delayed();

  await getTransactionData('LiquidityRemove', REMOVE_LIQUIDITY_V2_ADDR);
  await delayed();

  await getTransactionData('LiquidityRemove', CURVE_REMOVE_ADDR);
  await delayed();

  await getTransactionData('LiquidityRemove', SUSHI_REMOVE_ADDR);
  await delayed();

  await getTransactionData('LiquidityRemove', REMOVE_LIQUIDITY_ADDR);
  await delayed();
}

if (require.main === module) {
    void getTransactionDataForMixpanel();
}
