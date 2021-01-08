
const { stableHashObject, sign } = require("@iceteachain/common/src/ecc");
const { toDataString } = require("@iceteachain/common/src/codec");

const { wallet } = require('../../lovelock/src/helper/utils');
const logger = require("./log/logger");

import {
  toPublicKey,
  stableHashObject,
  sign,
  toPubKeyAndAddress,
  toPubKeyAndAddressBuffer,
} from '@iceteachain/common/src/ecc';

import {
  decode as codecDecode,
  toString as codecToString,
  toDataString as codecToDataString,
  toKeyBuffer as codecToKeyBuffer,
  toKeyString as codecToKeyString,
  isAddressType as codecIsAddressType,
} from '@iceteachain/common/src/codec';

function getSignData() {
  const mnenoic = "leisure bunker twice expect renew scorpion grow build cradle convince enable letter";
  private = getPrivateKeyFromMnemonic(mnemonic, 0);
  logger.info("privateKey: " + private);
  const permission = JSON.parse(localStorage.getItem("permissions"));
  const privateKey = permission.pk.toString();
  const publicKey = permission.pubK.toString();

  const time = Date.now();
  const hash32bytes = stableHashObject({ time });
  const signature = sign(hash32bytes, privateKey).signature;
  return { publicKey, sign: toDataString(signature), time };
}

function getPrivateKeyFromMnemonic(mnemonic, index = 0) {
  const hdkey = this.getHdKeyFromMnemonic(mnemonic);
  const { privateKey } = hdkey.deriveChild(index);
  return codecToKeyString(privateKey);
}

module.exports = {
  getSignData
}