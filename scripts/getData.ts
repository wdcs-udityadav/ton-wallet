import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "@ton/ton";
import Wallet from "../wrappers/Wallet"; 

export async function run() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // open Wallet instance by address
  const wallet_address = process.env.WALLET_ADDRESS || "";
  const walletAddress = Address.parse(wallet_address);
  const wallet = new Wallet(walletAddress);
  const walletContract = client.open(wallet);

  // call the getter on chain
  const data = await walletContract.getData();
  console.log("owner_address: ", data.owner_address.toString());
  console.log("balance: ", (data.balance)/10**9);
}