import { useState, useEffect } from "react";
import { ethers } from "ethers";
import DaiArtifact from "../artifacts/Dai.json";
import AvaxArtifact from "../artifacts/Avax.json";
import LendingArtifact from "../artifacts/Lending.json";
import { Dai as DaiContractType } from "../types/Dai";
import { Avax as AvaxContractType } from "../types/Avax";
import { Lending as LendingContractType } from "../types/Lending";
import { getEthereum } from "../utils/ethereum";

export const DaiAddress = "0xB962Ae94d9416f758938C5F58d11a61e019813B3";
export const AvaxAddress = "0x22016aEC5053294962D7Bb5aA2f25699c28c6D7D";
export const LendingAddress = "0x34863E2c73F6CdA40e7fDFC49fdFb55e7f61A93F";

export type TokenType = {
  symbol: string;
  contract: DaiContractType | AvaxContractType;
};

export type LendingType = {
  contract: LendingContractType;
};

type ReturnUseContract = {
  dai: TokenType | undefined;
  avax: TokenType | undefined;
  lending: LendingType | undefined;
};

export const useContract = (
  currentAccount: string | undefined
): ReturnUseContract => {
  const [dai, setDai] = useState<TokenType>();
  const [avax, setAvax] = useState<TokenType>();
  const [lending, setLending] = useState<LendingType>();
  const ethereum = getEthereum();

  const getContract = (
    contractAddress: string,
    abi: ethers.ContractInterface,
    storeContract: (_: ethers.Contract) => void
  ) => {
    if (!ethereum) {
      console.log("Ethereum object doesn't exist!");
      return;
    }
    if (!currentAccount) {
      // ログインしていない状態でコントラクトの関数を呼び出すと失敗するため
      // currentAccountがundefinedの場合はcontractオブジェクトもundefinedにします。
      console.log("currentAccount doesn't exist!");
      return;
    }
    try {
      // @ts-ignore: ethereum as ethers.providers.ExternalProvider
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner(); // 簡易実装のため, 引数なし = 初めのアカウント(account#0)を使用する
      const Contract = new ethers.Contract(contractAddress, abi, signer);
      storeContract(Contract);
    } catch (error) {
      console.log(error);
    }
  };

  const generateDai = async (contract: DaiContractType) => {
    try {
      const symbol = await contract.symbol();
      setDai({ symbol: symbol, contract: contract } as TokenType);
    } catch (error) {
      console.log(error);
    }
  };

  const generateAvax = async (contract: DaiContractType) => {
    try {
      const symbol = await contract.symbol();
      setAvax({ symbol: symbol, contract: contract } as TokenType);
    } catch (error) {
      console.log(error);
    }
  };

  const generateLending = async (contract: LendingContractType) => {
    try {
      setLending({
        contract: contract,
      } as LendingType);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getContract(DaiAddress, DaiArtifact.abi, (Contract: ethers.Contract) => {
      generateDai(Contract as DaiContractType);
    });
    getContract(AvaxAddress, AvaxArtifact.abi, (Contract: ethers.Contract) => {
      generateAvax(Contract as AvaxContractType);
    });
    getContract(
      LendingAddress,
      LendingArtifact.abi,
      (Contract: ethers.Contract) => {
        generateLending(Contract as LendingContractType);
      }
    );
  }, [ethereum, currentAccount]);

  return {
    dai,
    avax,
    lending,
  };
};
