import * as dotenv from 'dotenv'
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address } from "@ton/ton";
import Wallet from "../wrappers/Wallet";

dotenv.config()

export async function run() {
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    // open wallet v4
    const mnemonic = process.env.MNEMONIC || "";
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const walletV4 = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await client.isContractDeployed(walletV4.address)) {
        return console.log("walletV4 is not deployed");
    }

  // open walletV4 and read the current seqno
  const walletv4Contract = client.open(walletV4);
  const walletv4Sender = walletv4Contract.sender(key.secretKey);
  const seqno = await walletv4Contract.getSeqno();

  // open Wallet instance by address
  const wallet_address = process.env.WALLET_ADDRESS || "";
  const walletAddress = Address.parse(wallet_address);
  const wallet = new Wallet(walletAddress);
  const walletContract = client.open(wallet);

  // send the no-code deposit transaction
  await walletContract.sendNoCodeDeposit(walletv4Sender);

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = await walletv4Contract.getSeqno();
  }
  console.log("transaction confirmed!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
