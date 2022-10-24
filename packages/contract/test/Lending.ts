import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Lending", function () {
  async function deployContract() {
    const [owner, borrower, lender] = await ethers.getSigners();

    const amountForOther = ethers.utils.parseEther("5000");
    const CRTL = await ethers.getContractFactory("CollateralToken");
    const crtl = await CRTL.deploy();
    await crtl.faucet(borrower.address, amountForOther);
    await crtl.faucet(lender.address, amountForOther);

    const collateralAddress = crtl.address;
    const collateralAmount = ethers.utils.parseEther("500"); // 担保トークン
    const loanAmount = ethers.utils.parseEther("50"); // ether
    const payOffAmount = ethers.utils.parseEther("60"); // ether
    const loanDuration = 1;

    const LoanRequest = await ethers.getContractFactory("LoanRequest");
    const loanRequest = await LoanRequest.connect(borrower).deploy(
      collateralAddress,
      collateralAmount,
      loanAmount,
      payOffAmount,
      loanDuration
    );

    return {
      loanRequest,
      owner,
      borrower,
      lender,
      collateralToken: crtl,
      collateralAmount,
      loanAmount,
    };
  }

  describe("basic", function () {
    it("lend", async function () {
      const { loanRequest, borrower, lender, collateralToken } =
        await loadFixture(deployContract);

      const collateralAmount = await loanRequest.collateralAmount();
      const loanAmount = await loanRequest.loanAmount();

      await collateralToken
        .connect(borrower)
        .approve(loanRequest.address, collateralAmount);

      expect(
        await loanRequest.connect(lender).lendEther({ value: loanAmount })
      ).to.changeEtherBalance(borrower, loanAmount);
    });

    it("payLoan", async function () {
      const { loanRequest, borrower, lender, collateralToken } =
        await loadFixture(deployContract);

      const collateralAmount = await loanRequest.collateralAmount();
      const loanAmount = await loanRequest.loanAmount();

      await collateralToken
        .connect(borrower)
        .approve(loanRequest.address, collateralAmount);

      expect(
        await loanRequest.connect(lender).lendEther({ value: loanAmount })
      ).to.changeEtherBalance(borrower, loanAmount);

      /* ここまで前回と同じ */

      // ローンコントラクトの取得
      const loanContractAddress = await loanRequest.loan();
      const loan = await ethers.getContractAt("Loan", loanContractAddress);

      // 返済額の取得
      const payoffAmount = await loanRequest.payoffAmount();

      // ローンの返済
      expect(
        await loan.connect(borrower).payLoan({ value: payoffAmount })
      ).to.changeEtherBalances(
        [borrower, lender],
        [-payoffAmount, payoffAmount]
      );
      //TODO: 担保の変化もチェック
    });

    it("repossess", async function () {
      const { loanRequest, borrower, lender, collateralToken } =
        await loadFixture(deployContract);

      const collateralAmount = await loanRequest.collateralAmount();
      const loanAmount = await loanRequest.loanAmount();

      await collateralToken
        .connect(borrower)
        .approve(loanRequest.address, collateralAmount);

      expect(
        await loanRequest.connect(lender).lendEther({ value: loanAmount })
      ).to.changeEtherBalance(borrower, loanAmount);

      // ローンコントラクトの取得
      const loanContractAddress = await loanRequest.loan();
      const loan = await ethers.getContractAt("Loan", loanContractAddress);

      /* ここまで前回と同じ */

      // 返済期限を過ぎた期間の時刻取得
      const dueDate = await loan.dueDate();
      // 時間をその時間まで遅らせる
      await time.increaseTo(dueDate.add(1));

      // ローンの返済
      expect(await loan.connect(lender).repossess()).to.changeTokenBalances(
        collateralToken,
        [loan, lender],
        [-collateralAmount, collateralAmount]
      );
    });
  });
});
