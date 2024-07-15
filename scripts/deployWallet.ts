import * as dotenv from 'dotenv'
import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, Cell, WalletContractV4 } from "@ton/ton";
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

    // prepare Wallet's initial code and data cells for deployment
    const walletCode = Cell.fromBoc(fs.readFileSync("build/wallet.cell"))[0];
    const wallet = Wallet.createForDeploy(walletCode, walletV4.address);

    // exit if contract is already deployed
    console.log("contract address:", wallet.address.toString());
    if (await client.isContractDeployed(wallet.address)) {
        return console.log("Wallet already deployed");
    }

    // open walletV4 and read the current seqno
    const walletv4Contract = client.open(walletV4);
    const walletv4Sender = walletv4Contract.sender(key.secretKey);
    const seqno = await walletv4Contract.getSeqno();

    // send the deployment transaction
    const walletContract = client.open(wallet);
    await walletContract.sendDeploy(walletv4Sender);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log("waiting for deployment transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletv4Contract.getSeqno();
    }
    console.log("deployment transaction confirmed!");
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
