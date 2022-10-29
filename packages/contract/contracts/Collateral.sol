// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Loan.sol";

contract LoanRequest {
    address payable public borrower = payable(msg.sender);
    IERC20 public token;
    uint256 public collateralAmount;
    uint256 public loanAmount;
    uint256 public payoffAmount;
    uint256 public loanDuration;

    Loan public loan;

    event LoanRequestAccepted(address loan);

    constructor(
        IERC20 _token,
        uint256 _collateralAmount,
        uint256 _loanAmount,
        uint256 _payoffAmount,
        uint256 _loanDuration
    ) {
        token = _token;
        collateralAmount = _collateralAmount;
        loanAmount = _loanAmount;
        payoffAmount = _payoffAmount;
        loanDuration = _loanDuration;
        priceFeed = AggregatorV3Interface(
            /**
             * Network: Avalanche
             * Aggregator: AVAX/USD
             */
            0x0A77230d17318075983913bC2145DB16C7366156
        );
    }

    // この辺はネットが繋がる状態でテストしたい
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

    function lendEther() public payable {
        require(msg.value == loanAmount);
        loan = new Loan(
            payable(msg.sender),
            payable(borrower),
            token,
            collateralAmount,
            payoffAmount,
            loanDuration
        );
        require(token.transferFrom(borrower, address(loan), collateralAmount));
        borrower.transfer(loanAmount);
        emit LoanRequestAccepted(address(loan));
    }
}
