import { ethers } from "ethers";

import { ERC20__factory } from "@assets/contracts";
import { FLAT_FEE_RECIPIENT, getTokenInfo, Network, Token } from "@constants";
import { getNetworkProvider } from "@modules/blockchain/providers";
import { getClient, getSimpleAccount, useStackup } from "@contexts/StackupContext";

export const useTokenTransfer = (tokenId: Token, network: Network = "optimism") => {
  const { signer } = useStackup();

  const transfer = async (to: string, amount: ethers.BigNumber, fee: ethers.BigNumber): Promise<string> => {
    const token = getTokenInfo(tokenId, network);
    const provider = getNetworkProvider(network);

    const client = await getClient(network);
    const simpleAccount = await getSimpleAccount(signer, network);

    const erc20 = ERC20__factory.connect(token.address, provider);

    const transferData = erc20.interface.encodeFunctionData("transfer", [to, amount]);
    const feeData = erc20.interface.encodeFunctionData("transfer", [FLAT_FEE_RECIPIENT, fee]);

    if (fee.isZero()) {
      simpleAccount.execute(erc20.address, 0, transferData);
    } else {
      simpleAccount.executeBatch([erc20.address, erc20.address], [transferData, feeData]);
    }

    const res = await client.sendUserOperation(simpleAccount);
    const data = await res.wait();
    return data!.transactionHash;
  };

  return { transfer };
};
