const Web3 = require('web3')
const request = require('superagent')
const rlp = require('rlp')
const EthereumBlock = require('ethereumjs-block/from-rpc')
const commandLineArgs = require('command-line-args')

const peaceRelayABI = require('./peacerelay.json')
const submitBlock = require('./signing');
const settings = require("./settings.json");


const optionDefinitions = [
  { name: 'from', alias: 'f', type: String },
  { name: 'to', alias: 't', type: String },
  { name: 'start', type: Number },
  { name: 'privateKey', alias: 'p', type: String }
]

const options = commandLineArgs(optionDefinitions)

const from = settings[options.from].url;

const to = settings[options.to];
to.privateKey = settings[options.to].relayerPrivateKey;

const From = new Web3(new Web3.providers.HttpProvider(from));
const To = new Web3(new Web3.providers.HttpProvider(to.url));

const PeaceRelayTo = new To.eth.Contract(peaceRelayABI, to.peaceRelayAddress);

var currentBlockNumber = options.start;
console.log('startingBlockNumber:' + currentBlockNumber);


postFromWarmStart()



async function postFromWarmStart() {
  var highestBlockNumberOnRelay = await PeaceRelayTo.methods.highestBlock().call();
  console.log('highestBlockNumber seen on Relay: ' + highestBlockNumberOnRelay);
  currentBlockNumber = Math.max(highestBlockNumberOnRelay, currentBlockNumber);
  postFrom();
}

/**
 * @name postForm
 * @description <what-does-it-do?>
 * @param x Does something cool
 * @returns Something even cooler
 */
async function postFrom() {
  try {
    result = await request
      .post(from)
      .send({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 83 })
    var highestBlockNumber = parseInt(result.body.result, 16);
    await catchUp(highestBlockNumber);
  } catch (e) {
    console.error(e);
  }
}

/**
 * @name catchUp
 * @param i 
 * @param num
 * @returns  
 */
async function catchUp(highestBlockNumber) {
  if (currentBlockNumber < highestBlockNumber - 1) {
    const result = await relay(currentBlockNumber);
    if (result && result.body && result.body.error) {
      return await catchUp(highestBlockNumber)
    }
    currentBlockNumber += 1;
    await catchUp(highestBlockNumber)
  } else {
    console.log('Caught up to 2nd most current block!');
    setTimeout(async function() { await postFrom() }, (10000));
  }
}


async function relay(num) {
  try {
    console.log("About to relay " + num);
    block = await From.eth.getBlock(num);
    if (block === null) {
      return await relay(num);
    }
    var BN = From.utils.BN;
    data = await PeaceRelayTo.methods.submitBlock(new BN(block.hash).toString(), '0x' + rlp.encode(getRawHeader(block)).toString('hex')).encodeABI();
    hash = await submitBlock(data, to);
    return hash;
  } catch (e) {
    console.error(e);
  }

  function getRawHeader(_block) {
    if (typeof _block.difficulty != 'string') {
      _block.difficulty = '0x' + _block.difficulty.toString(16)
    }
    var block = new EthereumBlock(_block)
    return block.header.raw
  }
}
