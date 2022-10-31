import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Lending", function () {
  async function deployContract() {
    const [owner, borrower, lender] = await ethers.getSigners();

    /** トークンの用意 */
    const amountForOther = ethers.utils.parseEther("5000");
    // FMATICの用意
    const FMatic = await ethers.getContractFactory("FMatic");
    const fMatic = await FMatic.deploy();
    await fMatic.faucet(borrower.address, amountForOther);
    await fMatic.faucet(lender.address, amountForOther);
    // FAVAXの用意
    const FAvax = await ethers.getContractFactory("FAvax");
    const fAvax = await FAvax.deploy();
    await fAvax.faucet(borrower.address, amountForOther);
    await fAvax.faucet(lender.address, amountForOther);

    // 各定数定義
    const collateralAddress = fMatic.address;
    const collateralAmount = ethers.utils.parseEther("500"); // 担保トークン
    const loanAddress = fAvax.address;
    const loanAmount = ethers.utils.parseEther("50"); // ローントークン
    const payOffAmount = ethers.utils.parseEther("60");
    const loanDuration = 100;

    // deploy Lending
    const Lending = await ethers.getContractFactory("Lending");
    const lending = await Lending.deploy();

    // makeLoanRequest
    await lending
      .connect(borrower)
      .makeLoanRequest(
        collateralAddress,
        collateralAmount,
        loanAddress,
        loanAmount,
        payOffAmount,
        loanDuration
      );

    return {
      lending,
      borrower,
      lender,
      collateralToken: fMatic,
      loanToken: fAvax,
    };
  }

  describe("basic", function () {
    it("lend", async function () {
      const { lending, borrower, lender, collateralToken, loanToken } =
        await loadFixture(deployContract);

      // 担保となるトークンの移動準備
      const collateralAmount = await lending.collateralAmount();
      await collateralToken
        .connect(borrower)
        .approve(lending.address, collateralAmount);

      // ローンとなるトークンの移動準備
      const loanAmount = await lending.loanAmount();
      await loanToken.connect(lender).approve(lending.address, loanAmount);

      expect(await lending.connect(lender).lend()).to.changeTokenBalances(
        loanToken,
        [lender, borrower],
        [-loanAmount, loanAmount]
      );
      await lending.storeLatestPrice();
      console.log("===>", await lending.avaxStoredPrice());
      console.log("===>", await lending.maticStoredPrice());
    });

    it("payLoan", async function () {
      const { lending, borrower, lender, collateralToken, loanToken } =
        await loadFixture(deployContract);

      // 担保となるトークンの移動準備
      const collateralAmount = await lending.collateralAmount();
      await collateralToken
        .connect(borrower)
        .approve(lending.address, collateralAmount);

      // ローンとなるトークンの移動準備
      const loanAmount = await lending.loanAmount();
      await loanToken.connect(lender).approve(lending.address, loanAmount);

      expect(await lending.connect(lender).lend()).to.changeTokenBalances(
        loanToken,
        [lender, borrower],
        [-loanAmount, loanAmount]
      );

      /* ここまでlendと同じ */

      // ローンコントラクトの取得
      const loanContractAddress = await lending.loan();
      const loan = await ethers.getContractAt("Loan", loanContractAddress);

      // 返済するトークンの移動準備
      const payoffAmount = await loan.payoffAmount();
      await loanToken.connect(borrower).approve(loan.address, payoffAmount);

      // ローンの返済
      expect(await loan.connect(borrower).payLoan()).to.changeTokenBalances(
        loanToken,
        [borrower, lender],
        [-payoffAmount, payoffAmount]
      );
      //TODO: 担保の変化もチェック
    });

    it("repossess", async function () {
      const { lending, borrower, lender, collateralToken, loanToken } =
        await loadFixture(deployContract);

      // 担保となるトークンの移動準備
      const collateralAmount = await lending.collateralAmount();
      await collateralToken
        .connect(borrower)
        .approve(lending.address, collateralAmount);

      // ローンとなるトークンの移動準備
      const loanAmount = await lending.loanAmount();
      await loanToken.connect(lender).approve(lending.address, loanAmount);

      expect(await lending.connect(lender).lend()).to.changeTokenBalances(
        loanToken,
        [lender, borrower],
        [-loanAmount, loanAmount]
      );

      /* ここまでlendと同じ */

      // ローンコントラクトの取得
      const loanContractAddress = await lending.loan();
      const loan = await ethers.getContractAt("Loan", loanContractAddress);

      // 返済期限を過ぎた期間の時刻取得
      const dueDate = await loan.dueDate();
      // 時間をその時間より1遅らせる
      await time.increaseTo(dueDate.add(1));

      // 担保の没収
      expect(await loan.connect(lender).repossess()).to.changeTokenBalances(
        collateralToken,
        [loan, lender],
        [-collateralAmount, collateralAmount]
      );
    });
  });
});
