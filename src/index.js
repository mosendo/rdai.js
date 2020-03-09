import { DAI_ADDRESS, RDAI_ADDRESS } from "../config";
import Web3 from "web3";
import axios from "axios";
import RDAI_ABI from "../abi/rdai";
import DAI_ABI from "../abi/dai";
import BigNumber from "bignumber.js";

const cTokenApi = "https://api.compound.finance/api/v2/ctoken";
const ethGasStationApi = "https://ethgasstation.info/json/ethgasAPI.json";

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
    this.from = web3.eth.defaultAccount;
    this.DAI_ADDRESS = options.DAI_ADDRESS || DAI_ADDRESS;
    this.RDAI_ADDRESS = options.RDAI_ADDRESS || RDAI_ADDRESS;
    this.daiContract = new this.web3.eth.Contract(DAI_ABI, this.DAI_ADDRESS);
    this.rdaiContract = new this.web3.eth.Contract(RDAI_ABI, this.RDAI_ADDRESS);
  }

  getFastGasPrice = async () => {
    const res = await axios.get(ethGasStationApi);
    const fast = res.data.fast / 10;
    return this.web3.utils.toWei(String(fast), "gwei").toString();
  };

  getSendOptions = async () => {
    return {
      from: this.from,
      gasPrice: await this.getFastGasPrice()
    };
  };

  approve = async () => {
    const MAX_UINT = new BigNumber(2)
      .pow(256)
      .minus(1)
      .toFixed();
    return await this.daiContract.methods
      .approve(this.RDAI_ADDRESS, MAX_UINT)
      .send(await this.getSendOptions());
  };

  mintWithHat = async (amount, hat) => {
    return await this.rdaiContract.methods
      .mintWithNewHat(amount, hat.recipients, hat.proportions)
      .send(await this.getSendOptions());
  };

  mint = async amount => {
    return await this.rdaiContract.methods
      .mint(amount)
      .send(await this.getSendOptions());
  };

  createHat = async (hat, useHat = true) => {
    return await this.rdaiContract.methods
      .mintWithNewHat(hat.recipients, hat.proportions, useHat)
      .send(await this.getSendOptions());
  };

  getHat = address => {
    return this.rdaiContract.methods.getHatByAddress(address).call();
  };

  redeem = async amount => {
    if (typeof amount != "undefined") {
      return await this.rdaiContract.methods
        .redeem(amount)
        .send(await this.getSendOptions());
    } else {
      return await this.rdaiContract.methods
        .redeemAll()
        .send(await this.getSendOptions());
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
