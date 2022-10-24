// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CollateralToken is ERC20 {
    constructor() ERC20("Collateral Token", "CRTL") {
        _mint(msg.sender, 10000 ether);
    }

    function faucet(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }
}
