// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Loan {
    address payable public lender;
    address payable public borrower;
    IERC20 public collateralToken;
    uint256 public collateralAmount;
    IERC20 public loanToken;
    uint256 public payoffAmount;
    uint256 public dueDate;

    constructor(
        address payable _lender,
        address payable _borrower,
        IERC20 _collateralToken,
        uint256 _collateralAmount,
        IERC20 _loanToken,
        uint256 _payoffAmount,
        uint256 loanDuration
    ) {
        lender = _lender;
        borrower = _borrower;
        collateralToken = _collateralToken;
        collateralAmount = _collateralAmount;
        loanToken = _loanToken;
        payoffAmount = _payoffAmount;
        dueDate = block.timestamp + loanDuration;
    }

    event LoanPaid();

    function payLoan() public payable {
        require(block.timestamp <= dueDate);

        require(collateralToken.transfer(borrower, collateralAmount));
        require(loanToken.transferFrom(borrower, lender, payoffAmount));
        emit LoanPaid();
        selfdestruct(lender);
    }

    function repossess() public {
        require(block.timestamp > dueDate);

        require(collateralToken.transfer(lender, collateralAmount));
        selfdestruct(lender);
    }
}
