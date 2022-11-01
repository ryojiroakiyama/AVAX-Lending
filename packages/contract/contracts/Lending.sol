// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Loan.sol";
import "hardhat/console.sol";

contract Lending {
    address payable public borrower;
    IERC20 public collateralToken;
    uint256 public collateralAmount;
    IERC20 public loanToken;
    uint256 public loanAmount;

    uint256 public constant INTEREST_RATES = 20;
    uint256 public constant LOAN_DURATION = 7 days;

    Loan public loan;

    event LoanRequestAccepted(address loan);

    mapping(address => address) tokenToAggregator;

    constructor(address matic, address avax) {
        /**
         * Network: Avalanche Testnet
         * Aggregator: MATIC/USD
         */
        tokenToAggregator[matic] = 0xB0924e98CAFC880ed81F6A4cA63FD61006D1f8A0;

        /**
         * Network: Avalanche Testnet
         * Aggregator: AVAX/USD
         */
        tokenToAggregator[avax] = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;
    }

    // トークンの最新対USD価格を取得する
    function getLatestPrice(address token) public view returns (int256) {
        address aggregator = tokenToAggregator[token];
        (, int256 price, , , ) = AggregatorV3Interface(aggregator)
            .latestRoundData();
        return price;
    }

    function makeLoanRequest(
        IERC20 _collateralToken,
        uint256 _collateralAmount,
        IERC20 _loanToken,
        uint256 _loanAmount
    ) public payable {
        uint256 collateralValue = uint256(
            getLatestPrice(address(_collateralToken))
        ) * _collateralAmount;

        uint256 loanValue = uint256(getLatestPrice(address(_loanToken))) *
            _loanAmount;

        console.log(collateralValue, ": collateral value");
        console.log(loanValue, ": loan value");
        require(collateralValue > loanValue, "Loan exceeds collateral.");

        borrower = payable(msg.sender);
        collateralToken = _collateralToken;
        collateralAmount = _collateralAmount;
        loanToken = _loanToken;
        loanAmount = _loanAmount;
    }

    function lend() public payable {
        require(borrower != address(0), "Missing borrower");
        require(collateralAmount > 0 && loanAmount > 0, "Valid amount");

        uint256 payoffAmount = (loanAmount * (INTEREST_RATES + 100)) / 100;
        loan = new Loan(
            payable(msg.sender),
            payable(borrower),
            collateralToken,
            collateralAmount,
            loanToken,
            payoffAmount,
            LOAN_DURATION
        );
        console.log(loanAmount, ": loanAmount");
        console.log(payoffAmount, ": payoffAmount");
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
