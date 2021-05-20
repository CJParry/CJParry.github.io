// var Election = artifacts.require("./Election.sol");

// module.exports = function(deployer) {
//     deployer.deploy(Election);
// };


var BestToking = artifacts.require("./BestToking.sol");
//var BestToking = artifacts.require("./BestToking.sol");

module.exports = function(deployer) {
    //deployer.deploy(BestToking);
    deployer.deploy(BestToking, 100, "Best Toking Token", 1, "TOKE");

};