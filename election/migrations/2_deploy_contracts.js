// var Election = artifacts.require("./Election.sol");

// module.exports = function(deployer) {
//     deployer.deploy(Election);
// };


var BEP20Token = artifacts.require("./BEP20Token.sol");
//var BestToking = artifacts.require("./BestToking.sol");

module.exports = function(deployer) {
    //deployer.deploy(BestToking);
    //deployer.deploy(BestToking, 100, "Best Toking Token", 1, "TOKE");
    deployer.deploy(BEP20Token, 100, "BSC Toking Token", 1, "BSCT");


};