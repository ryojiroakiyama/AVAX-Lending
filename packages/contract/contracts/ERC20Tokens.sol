// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FMatic is ERC20 {
    constructor() ERC20("Fmatic Token", "FMATIC") {
        _mint(msg.sender, 10000 ether);
    }

    function faucet(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }
}

contract FAvax is ERC20 {
    constructor() ERC20("FAvax Token", "FAVAX") {
        _mint(msg.sender, 10000 ether);
    }

    function faucet(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }
}
