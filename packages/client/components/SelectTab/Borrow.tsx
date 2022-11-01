import { useCallback, useEffect, useState } from "react";
import { TokenType, LendingType } from "../../hooks/useContract";
import styles from "./SelectTab.module.css";
import InputNumberBox from "../InputBox/InputNumberBox";
import { ethers } from "ethers";
import { validAmount } from "../../utils/validAmount";

type Props = {
  token0: TokenType | undefined;
  token1: TokenType | undefined;
  lending: LendingType | undefined;
  currentAccount: string | undefined;
  updateDetails: () => void;
};

export default function Borrow({
  token0,
  token1,
  lending,
  currentAccount,
  updateDetails,
}: Props) {
  const [tokens, setTokens] = useState<TokenType[]>([]);
  const [price, setPrice] = useState<number[]>([]);

  useEffect(() => {
    if (!token0 || !token1) return;
    setTokens([token0, token1]);
  }, [token0, token1]);

  const getPrice = useCallback(async () => {
    if (!lending) return;
    if (tokens.length === 0) return;
    try {
      let newPrice: number[] = [];
      for (let index = 0; index < tokens.length; index++) {
        const latestPrice = await lending.contract.getLatestPrice(
          tokens[index].contract.address
        );
        const priceFormat = latestPrice.toNumber() / 100000000;
        newPrice.push(priceFormat);
      }
      setPrice(newPrice);
      alert("success");
    } catch (error) {
      alert(error);
    }
  }, [lending, tokens]);

  useEffect(() => {
    if (tokens.length !== 0) {
      getPrice();
    }
  }, [tokens, getPrice]);

  return (
    <div className={styles.tabBody}>
      {
        (tokens.length !== 0,
        price.length !== 0 && (
          <div>
            <div>
              {tokens[0].symbol}: {price[0]}
            </div>
            <div>
              {tokens[1].symbol}: {price[1]}
            </div>
          </div>
        ))
      }
    </div>
  );
}
