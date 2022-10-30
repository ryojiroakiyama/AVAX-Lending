// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Loan.sol";

contract Lending {
    address payable public borrower;
    IERC20 public collateralToken;
    uint256 public collateralAmount;
    IERC20 public loanToken;
    uint256 public loanAmount;
    uint256 public payoffAmount;
    uint256 public loanDuration;

    Loan public loan;

    event LoanRequestAccepted(address loan);

    /***  chainlinkを使用  ***/
    // この辺はネットが繋がる状態でテストしたい, ローカルテストじゃエラーが出る
    // これ参考: https://docs.chain.link/docs/data-feeds/price-feeds/addresses/?network=avalanche

    constructor() {
        priceFeed = AggregatorV3Interface(
            /**
             * Network: Avalanche
             * Aggregator: AVAX/USD
             */
            0x0A77230d17318075983913bC2145DB16C7366156
        );
    }

    AggregatorV3Interface internal priceFeed;
    int256 public storedPrice;

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int256) {
        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = priceFeed.latestRoundData();
        return price;
    }

    function storeLatestPrice() external {
        storedPrice = getLatestPrice();
    }

    /* ********** */

    function makeLoanRequest(
        IERC20 _collateralToken,
        uint256 _collateralAmount,
        IERC20 _loanToken,
        uint256 _loanAmount,
        uint256 _payoffAmount,
        uint256 _loanDuration
    ) public payable {
        borrower = payable(msg.sender);
        collateralToken = _collateralToken;
        collateralAmount = _collateralAmount;
        loanToken = _loanToken;
        loanAmount = _loanAmount;
        payoffAmount = _payoffAmount;
        loanDuration = _loanDuration;
    }

    function lend() public payable {
        require(borrower != address(0), "Missing borrower");
        loan = new Loan(
            payable(msg.sender),
            payable(borrower),
            collateralToken,
            collateralAmount,
            loanToken,
            payoffAmount,
            loanDuration
        );
        // collateral: borrower -> loan contract
        require(
            collateralToken.transferFrom(
                borrower,
                address(loan),
                collateralAmount
            )
        );
        // loan: lender -> borrower
        require(loanToken.transferFrom(msg.sender, borrower, loanAmount));
        emit LoanRequestAccepted(address(loan));
    }
}
