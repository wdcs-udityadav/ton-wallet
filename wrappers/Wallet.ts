import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "@ton/core";

export default class Wallet implements Contract {

    static createForDeploy(code: Cell, owner_address: Address): Wallet {
        const data = beginCell()
            .storeAddress(owner_address)
            .endCell();
        const workchain = 0;                        // deploy to workchain 0
        const address = contractAddress(workchain, { code, data });
        return new Wallet(address, { code, data });
    }

    constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) { }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: "0.01",                          // send 0.01 TON to contract for rent
            bounce: false
        });
    }

    async sendDeposit(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell()
            .storeUint(1, 32)                       // op (op #1 = deposit)
            .endCell();
        await provider.internal(via, {
            value: "0.003",
            body: messageBody
        });
    }

    async sendNoCodeDeposit(provider: ContractProvider, via: Sender) {
        const messageBody = beginCell().endCell();
        await provider.internal(via, {
            value: "0.004",
            body: messageBody
        });
    }

    async sendWithdraw(provider: ContractProvider, via: Sender, amount: bigint) {
        const messageBody = beginCell()
            .storeUint(2, 32)                       // op (op #2 = withdraw)
            .storeCoins(amount)                     // amount to withdraw
            .endCell()
        await provider.internal(via, {
            value: "0.002",
            body: messageBody
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_contract_storage", []);
        return {
            owner_address: stack.readAddress(),
            balance: stack.readNumber()
        }
    }
}
