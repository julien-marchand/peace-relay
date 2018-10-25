var PeaceRelay = artifacts.require("./PeaceRelay.sol");

module.exports = function(deployer) {
  deployer.deploy(PeaceRelay, 0)
    .then(function() {
    }).catch(e => console.log(e));
};