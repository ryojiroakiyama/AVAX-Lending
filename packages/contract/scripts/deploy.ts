import { ethers } from "hardhat";

async function deploy() {
  // コントラクトをデプロイするアカウントのアドレスを取得します。
  const [deployer] = await ethers.getSigners();

  // FMATICトークンのコントラクトをデプロイします。
  const FMatic = await ethers.getContractFactory("FMatic");
  const fMatic = await FMatic.deploy();
  await fMatic.deployed();

  // FAVAXトークンのコントラクトをデプロイします。
  const FAvax = await ethers.getContractFactory("FAvax");
  const fAvax = await FAvax.deploy();
  await fAvax.deployed();

  // Lendingコントラクトをデプロイします。
  const Lending = await ethers.getContractFactory("Lending");
  const lending = await Lending.deploy(fMatic.address, fAvax.address);
  await lending.deployed();

  console.log("fMatic address:", fMatic.address);
  console.log("fAvax address:", fAvax.address);
  console.log("lending address:", lending.address);
  console.log("account address that deploy contract:", deployer.address);
}

deploy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
