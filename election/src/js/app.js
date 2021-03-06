App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    hasVoted: false,

    init: function() {
        return App.initWeb3();
    },

    myFunction: function() {
        console.log("Inhereee");
    },

    initWeb3: function() {
        // Modern DApp Browsers
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            try {
                window.ethereum.enable().then(function() {
                    // User has allowed account access to DApp...
                });
            } catch (e) {
                // User has denied account access to DApp...
            }
        }
        // Legacy DApp Browsers
        else if (window.web3) {
            web3 = new Web3(web3.currentProvider);
        }
        // Non-DApp Browsers
        else {
            alert('You have to install MetaMask !');
        }

        // Check the connection
        if (!web3.isConnected()) {
            console.log("Not connected");

        }
        var account = web3.eth.accounts[0];
        var accountInterval = setInterval(function() {
            if (web3.eth.accounts[0] !== account) {
                account = web3.eth.accounts[0];
                document.getElementById("accountAddress").innerHTML = "Connected account: " + account;
            }
        }, 100);
        console.log(account);
        // TODO Check windows has loaded
        $(document).ready(function() {
            document.getElementById('accountAddress').innerHTML = "Connected account: " + account;
        });
        return App.initContract();
    },

    initContract: function() {
        // $.getJSON("Election.json", function(election) {
        //     // Instantiate a new truffle contract from the artifact
        //     App.contracts.Election = TruffleContract(election);
        //     // Connect provider to interact with contract
        //     App.contracts.Election.setProvider(App.web3Provider);

        //     App.listenForEvents();

        //     return App.render();
        // });
    },

    // Listen for events emitted from the contract
    listenForEvents: function() {
        App.contracts.Election.deployed().then(function(instance) {
            // Restart Chrome if you are unable to receive this event
            // This is a known issue with Metamask
            // https://github.com/MetaMask/metamask-extension/issues/2393
            instance.votedEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function(error, event) {
                console.log("event triggered", event)
                    // Reload when a new vote is recorded
                App.render();
            });
        });
    },

    render: function() {
        var electionInstance;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        // Load account data
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your Account: " + account);
            }
        });

        // Load contract data
        App.contracts.Election.deployed().then(function(instance) {
            electionInstance = instance;
            return electionInstance.candidatesCount();
        }).then(function(candidatesCount) {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();

            var candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();

            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function(candidate) {
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];

                    // Render candidate Result
                    var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
                    candidatesResults.append(candidateTemplate);

                    // Render candidate ballot option
                    var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
                    candidatesSelect.append(candidateOption);
                });
            }
            return electionInstance.voters(App.account);
        }).then(function(hasVoted) {
            // Do not allow a user to vote
            if (hasVoted) {
                $('form').hide();
            }
            loader.hide();
            content.show();
        }).catch(function(error) {
            console.warn(error);
        });
    },

    castVote: function() {
        var candidateId = $('#candidatesSelect').val();
        App.contracts.Election.deployed().then(function(instance) {
            return instance.vote(candidateId, { from: App.account });
        }).then(function(result) {
            // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function(err) {
            console.error(err);
        });
    }
};

var BestToking; // = require('./BestToking.json'); //with path
$.getJSON("./js/BestToking.json", function(json) {
    // console.log(json); // this will show the info it in firebug console
    BestToking = json;
});


var bep20Token; // = require('./BestToking.json'); //with path
$.getJSON("./js/BEP20Token.json", function(json) {
    //console.log(json); // this will show the info it in firebug console
    bep20Token = json;
});

var network = "eth";

createToken = function() {
    console.log("in myFunction");

    //window.ethereum.enable();
    // Get input values
    var name = document.getElementById("name").value;
    var short = document.getElementById("short").value;
    var maxSupply = document.getElementById("maxSupply").value * 1000000000000000000;
    var decimals = 18; //document.getElementById("decimals").value;
    console.log("network = " + network);

    console.log("bestToking = " + BestToking);
    console.log("bestToking.abi = " + BestToking.abi);


    var tokenType = BestToking;
    // Check local variable to decide between erc20 and bep20 token
    if (network == "bsc") {
        console.log("creating bep");
        tokenType = bep20Token;
    }


    console.log("TokenType = " + tokenType);
    console.log("TokenType.abi = " + tokenType.abi);

    // deploy new contract
    // var MyContract = web3.eth.contract(BestToking.abi);
    var MyContract = web3.eth.contract(tokenType.abi);
    var contractInstance = MyContract.new(maxSupply, name, decimals, short, { data: tokenType.bytecode, from: web3.eth.accounts[0] }, function(e, contract) {
        if (!e) {
            if (!contract.address) {
                console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
            } else {
                console.log("Contract mined! Address: " + contract.address);
                console.log(contract);
                this.suggestToken(contract.address, short, decimals);
                address = contract.address;
            }
        } else {
            console.log(e);
        }
    });
    // Create / edit contract with values
    // Deploy / migrate contract!
}

suggestToken = async function(tokenAddress, tokenSymbol, tokenDecimals) {
    // var tokenImage = checkForLogo();
    // const tokenImage = 'http://placekitten.com/200/300';
    try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20', // Initially only supports ERC20, but eventually more!
                options: {
                    address: tokenAddress, // The address that the token is at.
                    symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                    decimals: tokenDecimals, // The number of decimals in the token
                    //    image: tokenImage, // A string url of the token logo
                },
            },
        });

        if (wasAdded) {
            console.log('Token added, enjoy!');
        } else {
            console.log('Selected no? Find the tokens contract address in your metamask transaction history');
        }
    } catch (error) {
        console.log(error);
    }
}

networkSwitch = function() {
    if (network == "eth") {
        network = "bsc";
        console.log("network switched to bsc");
        alert("The BSC network has not been tested as thoroughly as the ETH network. Use at your own risk :)");
    } else {
        network = "eth";
        console.log("network switched to eth");
        alert("Did you try BSC? Let us know");
    }
}

fieldsIncomplete = function() {
    var name = document.getElementById("name").value;
    var short = document.getElementById("short").value;
    var maxSupply = document.getElementById("maxSupply").value * 1000000000000000000;
    var checkbox = document.getElementById("termsCheckbox").checked;

    if (name == "" || short == "" || maxSupply == "" || !checkbox) {
        return true;
    } else {
        return false;
    }
}

payMe = function() {
    if (fieldsIncomplete()) {
        alert("Please complete all fields");
        return;
    }
    console.log(web3.eth.accounts[0]);
    console.log("in payMe function");
    createToken();

    //Sending Ethereum to an address
    //  sendEthButton.addEventListener('click', () => {
    // ethereum
    //     .request({
    //         method: 'eth_sendTransaction',
    //         params: [{
    //             from: web3.eth.accounts[0],
    //             to: '0x4398D4149b98D5a31B8BA8Bd87f81404190E4434',
    //             //value: '4500000000000',
    //             value: '3900000000000',
    //         }, ],
    //     })
    //     .then(
    //         function(env) {
    //             // (txHash) => console.log(txHash);
    //             console.log("commission received");
    //             createToken();
    //         }
    //     )
    //     .catch((error) => console.error);
    //   });
}

$(function() {
    $(window).load(function() {
        App.init();
    });
});