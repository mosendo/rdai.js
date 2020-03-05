import { DAI_ADDRESS, RDAI_ADDRESS } from "../config";
import Web3 from "web3";
import axios from "axios";
import RDAI_ABI from "../abi/rdai";
import DAI_ABI from "../abi/dai";

const cTokenApi = "https://api.compound.finance/api/v2/ctoken";

class RedeemDai {
  web3;
  rdaiContract;
  daiContract;
  sendOptions;
  DAI_ADDRESS;
  RDAI_ADDRESS;

  constructor(web3, options = {}) {
    if (typeof web3 === "undefined") throw new Error("Web3 must be provided");
    if (typeof web3.currentProvider === "undefined")
      throw new Error(
        "Web3 instance does not support .currentProvider property"
      );
    this.web3 = new Web3(web3.currentProvider);
    this.sendOptions = {
      from: web3.eth.defaultAccount
    };
    this.DAI_ADDRESS = options.DAI_ADDRESS || DAI_ADDRESS;
    this.RDAI_ADDRESS = options.RDAI_ADDRESS || RDAI_ADDRESS;
    this.daiContract = new this.web3.eth.Contract(DAI_ABI, this.DAI_ADDRESS);
    this.rdaiContract = new this.web3.eth.Contract(RDAI_ABI, this.RDAI_ADDRESS);
  }

  formatAmount = amount => {
    if (typeof amount === "number")
      return this.web3.utils.toWei(amount, "ether");
    else if (typeof amount === "string") return new this.web3.utils.BN(amount);
    else if (typeof amount === "object") return amount;
    else throw new Error("unsupported amount type");
  };

  approve = () => {
    const BN = this.web3.utils.BN;
    const MAX_UINT = new BN(2).pow(256).sub(1);
    return this.daiContract.methods
      .approve(this.RDAI_ADDRESS, MAX_UINT)
      .send(this.sendOptions);
  };

  mintWithHat = (amount, hat) => {
    amount = this.formatAmount(amount);
    return this.rdaiContract.methods
      .mintWithNewHat(amount, hat.recipients, hat.proportions)
      .send();
  };

  mint = amount => {
    amount = this.formatAmount(amount);
    return this.rdaiContract.methods.mint(amount).send(this.sendOptions);
  };

  getHat = address => {
    return this.rdaiContract.methods.getHatByAddress(address).call();
  };

  redeem = amount => {
    if (typeof amount != "undefined") {
      amount = this.formatAmount(amount);
      return this.rdaiContract.methods.redeem(amount).send(this.sendOptions);
    } else {
      return this.rdaiContract.methods.redeemAll().send(this.sendOptions);
    }
  };

  getDaiBalance = address => {
    return this.daiContract.methods.balanceOf(address).call();
  };

  getRdaiBalance = address => {
    return this.rdaiContract.methods.balanceOf(address).call();
  };

  getInterestEarned = address => {
    return this.rdaiContract.methods.interestPayableOf(address).call();
  };

  getInterestRate = async () => {
    const cTokens = (await axios.get(cTokenApi)).data.cToken;
    const cDai = cTokens.filter(cToken => cToken.symbol === "cDAI")[0];
    const rate = cDai.supply_rate.value;
    const percentage = (rate * 100).toFixed(2);
    return Number(percentage);
  };
}

export default RedeemDai;
