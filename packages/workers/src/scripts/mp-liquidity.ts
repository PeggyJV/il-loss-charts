import dotenv from 'dotenv';
dotenv.config();

import Mixpanel from 'mixpanel';
let mixpanel: Mixpanel.Mixpanel;
import fetch from 'node-fetch';

const MS_PER_MINUTE = 60000;
const key = process.env.ETHPLORER_API_KEY || 'freekey';

const ADD_LIQUIDITY_ADDR = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const REMOVE_LIQUIDITY_ADDR = '0x418915329226AE7fCcB20A2354BbbF0F6c22Bd92';

if (key == 'freekey') {
  console.log('Limited results without official ethplorer key.');
}


if (process.env.MIXPANEL_TOKEN) {
    mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, { secret: process.env.MIXPANEL_SECRET });
} else {
    throw new Error(`Cannot start il alerts mixpanel liquidity bot without mixpanel token.`);
}

interface AddressTransaction {
  timestamp: number;
  from: string;
  to: string;
  hash: string;
  value: number;
  input: string;
  success: boolean;
}

async function getTransactionData(transactionType: string, hash: string): Promise<void> {
  const oneHoursBefore = Date.now() - (MS_PER_MINUTE * 60);

  const addPath ='https://api.ethplorer.io/getAddressTransactions/';
  const fullPath = `${addPath}${hash}?apiKey=${
      key
  }&limit=200&timestamp=${
    oneHoursBefore
  }`

  const res = await fetch(fullPath);
  const data = await res.json();

  data.forEach((addressTransaction: AddressTransaction) => {
    const txTimestamp = new Date(addressTransaction.timestamp * 1000);
    
    if(txTimestamp.getTime() > oneHoursBefore) {
      mixpanel.import(`Uniswap:${transactionType}`,addressTransaction.timestamp,  {
        distinct_id: addressTransaction.from,
        time: addressTransaction.timestamp,
        timestamp: txTimestamp.toISOString(),
        to: addressTransaction.to,
        from: addressTransaction.from,
        hash: addressTransaction.hash,
        value: addressTransaction.value,
        success: addressTransaction.success
      });
    }
  });
}

export default async function getTransactionDataForMixpanel(): Promise<void> {
  await getTransactionData('LiquidityAdd', ADD_LIQUIDITY_ADDR);
  await getTransactionData('LiquidityRemove', REMOVE_LIQUIDITY_ADDR);
}

if (require.main === module) {
    void getTransactionDataForMixpanel();
}
