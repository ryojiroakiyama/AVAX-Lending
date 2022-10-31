import { ethers } from "hardhat";

async function deploy() {
  // コントラクトをデプロイするアカウントのアドレスを取得します。
  const [deployer] = await ethers.getSigners();

  // DAIトークンのコントラクトをデプロイします。
  const Dai = await ethers.getContractFactory("Dai");
  const dai = await Dai.deploy();
  await dai.deployed();

  // AVAXトークンのコントラクトをデプロイします。
  const Avax = await ethers.getContractFactory("Avax");
  const avax = await Avax.deploy();
  await avax.deployed();

  // Lendingコントラクトをデプロイします。
  const Lending = await ethers.getContractFactory("Lending");
  const lending = await Lending.deploy();
  await lending.deployed();

  console.log("dai address:", dai.address);
  console.log("avax address:", avax.address);
  console.log("lending address:", lending.address);
  console.log("account address that deploy contract:", deployer.address);
}

deploy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
