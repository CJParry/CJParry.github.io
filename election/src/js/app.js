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

        // if (typeof web3 !== 'undefined') {
        //     console.log("1");

        //     // If a web3 instance is already provided by Meta Mask.
        //     App.web3Provider = web3.currentProvider;
        //     web3 = new Web3(web3.currentProvider);
        //     console.log(web3.currentProvider);

        // } else {
        //     console.log("2");

        //     // Specify default instance if no web3 instance provided
        //     App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        //     web3 = new Web3(App.web3Provider);
        // }
        // Check the connection
        if (!web3.isConnected()) {
            console.log("Not connected");

        }
        var account = web3.eth.accounts[0];
        var accountInterval = setInterval(function() {
            if (web3.eth.accounts[0] !== account) {
                account = web3.eth.accounts[0];
                document.getElementById("address").innerHTML = account;
            }
        }, 100);
        console.log(account);
        // TODO Check windows has loaded
        document.getElementById('accountAddress').innerHTML = "Your account to recieve the tokens: " + account;

        return App.initContract();
    },

    initContract: function() {
        $.getJSON("Election.json", function(election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);

            App.listenForEvents();

            return App.render();
        });
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

myFunction = function() {
    //window.ethereum.enable();
    // Get input values
    var name = document.getElementById("name").value;
    var short = document.getElementById("short").value;
    var maxSupply = document.getElementById("maxSupply").value;
    var decimals = document.getElementById("decimals").value;

    // deploy new contract
    var MyContract = web3.eth.contract(BestToking.abi);
    var contractInstance = MyContract.new(maxSupply, name, decimals, short, { data: options.data, from: web3.eth.accounts[0], gas: 1000000 }, function(e, contract) {
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
                },
            },
        });

        if (wasAdded) {
            console.log('Thanks for your interest!');
        } else {
            console.log('Your loss!');
        }
    } catch (error) {
        console.log(error);
    }
}

payMe = function() {
    const ethereumButton = document.querySelector('.enableEthereumButton');
    const sendEthButton = document.querySelector('.sendEthButton');

    console.log(web3.eth.accounts[0]);

    //Sending Ethereum to an address
    //  sendEthButton.addEventListener('click', () => {
    ethereum
        .request({
            method: 'eth_sendTransaction',
            params: [{
                from: web3.eth.accounts[0],
                to: '0x4398D4149b98D5a31B8BA8Bd87f81404190E4434',
                value: '500000000000000',
                // gasPrice: '0x09184e72a000',
                // gas: '0x2710',
            }, ],
        })
        .then(
            function(env) {
                // (txHash) => console.log(txHash);
                myFunction();
            }
        )
        .catch((error) => console.error);
    //   });
}

$(function() {
    $(window).load(function() {
        App.init();
    });
});


var options = {
    data: "0x60806040523480156200001157600080fd5b5060405162000f8a38038062000f8a833981810160405260808110156200003757600080fd5b8101908080519060200190929190805160405193929190846401000000008211156200006257600080fd5b838201915060208201858111156200007957600080fd5b82518660018202830111640100000000821117156200009757600080fd5b8083526020830192505050908051906020019080838360005b83811015620000cd578082015181840152602081019050620000b0565b50505050905090810190601f168015620000fb5780820380516001836020036101000a031916815260200191505b5060405260200180519060200190929190805160405193929190846401000000008211156200012957600080fd5b838201915060208201858111156200014057600080fd5b82518660018202830111640100000000821117156200015e57600080fd5b8083526020830192505050908051906020019080838360005b838110156200019457808201518184015260208101905062000177565b50505050905090810190601f168015620001c25780820380516001836020036101000a031916815260200191505b5060405250505083600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508360008190555082600390805190602001906200022c9291906200026b565b5081600460006101000a81548160ff021916908360ff1602179055508060059080519060200190620002609291906200026b565b50505050506200031a565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10620002ae57805160ff1916838001178555620002df565b82800160010185558215620002df579182015b82811115620002de578251825591602001919060010190620002c1565b5b509050620002ee9190620002f2565b5090565b6200031791905b8082111562000313576000816000905550600101620002f9565b5090565b90565b610c60806200032a6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c8063313ce56711610071578063313ce567146102935780635c658165146102b757806370a082311461032f57806395d89b4114610387578063a9059cbb1461040a578063dd62ed3e14610470576100a9565b806306fdde03146100ae578063095ea7b31461013157806318160ddd1461019757806323b872dd146101b557806327e235e31461023b575b600080fd5b6100b66104e8565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156100f65780820151818401526020810190506100db565b50505050905090810190601f1680156101235780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61017d6004803603604081101561014757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610586565b604051808215151515815260200191505060405180910390f35b61019f610678565b6040518082815260200191505060405180910390f35b610221600480360360608110156101cb57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061067e565b604051808215151515815260200191505060405180910390f35b61027d6004803603602081101561025157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610916565b6040518082815260200191505060405180910390f35b61029b61092e565b604051808260ff1660ff16815260200191505060405180910390f35b610319600480360360408110156102cd57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610941565b6040518082815260200191505060405180910390f35b6103716004803603602081101561034557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610966565b6040518082815260200191505060405180910390f35b61038f6109af565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103cf5780820151818401526020810190506103b4565b50505050905090810190601f1680156103fc5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6104566004803603604081101561042057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610a4d565b604051808215151515815260200191505060405180910390f35b6104d26004803603604081101561048657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ba4565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561057e5780601f106105535761010080835404028352916020019161057e565b820191906000526020600020905b81548152906001019060200180831161056157829003601f168201915b505050505081565b600081600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60005481565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015801561074f5750828110155b61075857600080fd5b82600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156108a55782600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040518082815260200191505060405180910390a360019150509392505050565b60016020528060005260406000206000915090505481565b600460009054906101000a900460ff1681565b6002602052816000526040600020602052806000526040600020600091509150505481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a455780601f10610a1a57610100808354040283529160200191610a45565b820191906000526020600020905b815481529060010190602001808311610a2857829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610a9b57600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490509291505056fea265627a7a72315820f94523404fcbecc0c05e99299ae998a447b2f625a47c72273a4c8c355af3a85664736f6c63430005100032"
};

var BestToking = {
    "contractName": "BestToking",
    "abi": [{
            "inputs": [{
                    "internalType": "uint256",
                    "name": "_initialAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "_tokenName",
                    "type": "string"
                },
                {
                    "internalType": "uint8",
                    "name": "_decimalUnits",
                    "type": "uint8"
                },
                {
                    "internalType": "string",
                    "name": "_tokenSymbol",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [{
                    "indexed": true,
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                    "indexed": true,
                    "internalType": "address",
                    "name": "_from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "constant": true,
            "inputs": [{
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "allowed",
            "outputs": [{
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{
                "internalType": "address",
                "name": "",
                "type": "address"
            }],
            "name": "balances",
            "outputs": [{
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [{
                "internalType": "string",
                "name": "",
                "type": "string"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [{
                "internalType": "string",
                "name": "",
                "type": "string"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [{
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{
                    "internalType": "address",
                    "name": "_from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [{
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            }],
            "name": "balanceOf",
            "outputs": [{
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{
                    "internalType": "address",
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [{
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [{
                "internalType": "uint256",
                "name": "remaining",
                "type": "uint256"
            }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ],
    "metadata": "{\"compiler\":{\"version\":\"0.5.16+commit.9c3226ce\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_initialAmount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"_tokenName\",\"type\":\"string\"},{\"internalType\":\"uint8\",\"name\":\"_decimalUnits\",\"type\":\"uint8\"},{\"internalType\":\"string\",\"name\":\"_tokenSymbol\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_spender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_spender\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"remaining\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"allowed\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"success\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"balances\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"success\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"success\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"}],\"devdoc\":{\"methods\":{}},\"userdoc\":{\"methods\":{}}},\"settings\":{\"compilationTarget\":{\"/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/BestToking.sol\":\"BestToking\"},\"evmVersion\":\"istanbul\",\"libraries\":{},\"optimizer\":{\"enabled\":false,\"runs\":200},\"remappings\":[]},\"sources\":{\"/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/BestToking.sol\":{\"keccak256\":\"0x6752096ad6511587e34393d926ff81dc070f3e5a42ed1bca2b6a3a3e941e264e\",\"urls\":[\"bzz-raw://e19ce27a4fd38275a39f0eabfe1063c45ea0feb99da9f56cf8da5377db1810ed\",\"dweb:/ipfs/QmXZtSndWYEZ8vL9Kg3iScqGB78BgKVJ6C51skqAdxCmTU\"]},\"/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/EIP20Interface.sol\":{\"keccak256\":\"0x8c9e1129a562b1b4e1fb7af598cb0aa2dfb4bfd985e45787a921fc5af500b6de\",\"urls\":[\"bzz-raw://e05b4f4240d73206256df1db898d581fa6cc82c59ed9e096f44e444dea2b26cf\",\"dweb:/ipfs/QmNMPZ1ixN1hw8CZRQAPRnYyMmMwVTFjxjXAXzoPcyEPa5\"]}},\"version\":1}",
    "bytecode": "0x60806040523480156200001157600080fd5b5060405162000f8a38038062000f8a833981810160405260808110156200003757600080fd5b8101908080519060200190929190805160405193929190846401000000008211156200006257600080fd5b838201915060208201858111156200007957600080fd5b82518660018202830111640100000000821117156200009757600080fd5b8083526020830192505050908051906020019080838360005b83811015620000cd578082015181840152602081019050620000b0565b50505050905090810190601f168015620000fb5780820380516001836020036101000a031916815260200191505b5060405260200180519060200190929190805160405193929190846401000000008211156200012957600080fd5b838201915060208201858111156200014057600080fd5b82518660018202830111640100000000821117156200015e57600080fd5b8083526020830192505050908051906020019080838360005b838110156200019457808201518184015260208101905062000177565b50505050905090810190601f168015620001c25780820380516001836020036101000a031916815260200191505b5060405250505083600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508360008190555082600390805190602001906200022c9291906200026b565b5081600460006101000a81548160ff021916908360ff1602179055508060059080519060200190620002609291906200026b565b50505050506200031a565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10620002ae57805160ff1916838001178555620002df565b82800160010185558215620002df579182015b82811115620002de578251825591602001919060010190620002c1565b5b509050620002ee9190620002f2565b5090565b6200031791905b8082111562000313576000816000905550600101620002f9565b5090565b90565b610c60806200032a6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c8063313ce56711610071578063313ce567146102935780635c658165146102b757806370a082311461032f57806395d89b4114610387578063a9059cbb1461040a578063dd62ed3e14610470576100a9565b806306fdde03146100ae578063095ea7b31461013157806318160ddd1461019757806323b872dd146101b557806327e235e31461023b575b600080fd5b6100b66104e8565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156100f65780820151818401526020810190506100db565b50505050905090810190601f1680156101235780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61017d6004803603604081101561014757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610586565b604051808215151515815260200191505060405180910390f35b61019f610678565b6040518082815260200191505060405180910390f35b610221600480360360608110156101cb57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061067e565b604051808215151515815260200191505060405180910390f35b61027d6004803603602081101561025157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610916565b6040518082815260200191505060405180910390f35b61029b61092e565b604051808260ff1660ff16815260200191505060405180910390f35b610319600480360360408110156102cd57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610941565b6040518082815260200191505060405180910390f35b6103716004803603602081101561034557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610966565b6040518082815260200191505060405180910390f35b61038f6109af565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103cf5780820151818401526020810190506103b4565b50505050905090810190601f1680156103fc5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6104566004803603604081101561042057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610a4d565b604051808215151515815260200191505060405180910390f35b6104d26004803603604081101561048657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ba4565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561057e5780601f106105535761010080835404028352916020019161057e565b820191906000526020600020905b81548152906001019060200180831161056157829003601f168201915b505050505081565b600081600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60005481565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015801561074f5750828110155b61075857600080fd5b82600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156108a55782600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040518082815260200191505060405180910390a360019150509392505050565b60016020528060005260406000206000915090505481565b600460009054906101000a900460ff1681565b6002602052816000526040600020602052806000526040600020600091509150505481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a455780601f10610a1a57610100808354040283529160200191610a45565b820191906000526020600020905b815481529060010190602001808311610a2857829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610a9b57600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490509291505056fea265627a7a72315820f94523404fcbecc0c05e99299ae998a447b2f625a47c72273a4c8c355af3a85664736f6c63430005100032",
    "deployedBytecode": "0x608060405234801561001057600080fd5b50600436106100a95760003560e01c8063313ce56711610071578063313ce567146102935780635c658165146102b757806370a082311461032f57806395d89b4114610387578063a9059cbb1461040a578063dd62ed3e14610470576100a9565b806306fdde03146100ae578063095ea7b31461013157806318160ddd1461019757806323b872dd146101b557806327e235e31461023b575b600080fd5b6100b66104e8565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156100f65780820151818401526020810190506100db565b50505050905090810190601f1680156101235780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61017d6004803603604081101561014757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610586565b604051808215151515815260200191505060405180910390f35b61019f610678565b6040518082815260200191505060405180910390f35b610221600480360360608110156101cb57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061067e565b604051808215151515815260200191505060405180910390f35b61027d6004803603602081101561025157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610916565b6040518082815260200191505060405180910390f35b61029b61092e565b604051808260ff1660ff16815260200191505060405180910390f35b610319600480360360408110156102cd57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610941565b6040518082815260200191505060405180910390f35b6103716004803603602081101561034557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610966565b6040518082815260200191505060405180910390f35b61038f6109af565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103cf5780820151818401526020810190506103b4565b50505050905090810190601f1680156103fc5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6104566004803603604081101561042057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610a4d565b604051808215151515815260200191505060405180910390f35b6104d26004803603604081101561048657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ba4565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561057e5780601f106105535761010080835404028352916020019161057e565b820191906000526020600020905b81548152906001019060200180831161056157829003601f168201915b505050505081565b600081600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60005481565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015801561074f5750828110155b61075857600080fd5b82600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156108a55782600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040518082815260200191505060405180910390a360019150509392505050565b60016020528060005260406000206000915090505481565b600460009054906101000a900460ff1681565b6002602052816000526040600020602052806000526040600020600091509150505481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a455780601f10610a1a57610100808354040283529160200191610a45565b820191906000526020600020905b815481529060010190602001808311610a2857829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610a9b57600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490509291505056fea265627a7a72315820f94523404fcbecc0c05e99299ae998a447b2f625a47c72273a4c8c355af3a85664736f6c63430005100032",
    "sourceMap": "179:2794:0:-;;;910:661;8:9:-1;5:2;;;30:1;27;20:12;5:2;910:661:0;;;;;;;;;;;;;;;13:3:-1;8;5:12;2:2;;;30:1;27;20:12;2:2;910:661:0;;;;;;;;;;;;;;;;;;;;;;19:11:-1;14:3;11:20;8:2;;;44:1;41;34:12;8:2;71:11;66:3;62:21;55:28;;123:4;118:3;114:14;159:9;141:16;138:31;135:2;;;182:1;179;172:12;135:2;219:3;213:10;330:9;325:1;311:12;307:20;289:16;285:43;282:58;261:11;247:12;244:29;233:115;230:2;;;361:1;358;351:12;230:2;384:12;379:3;372:25;420:4;415:3;411:14;404:21;;0:432;;910:661:0;;;;;;;;;;23:1:-1;8:100;33:3;30:1;27:10;8:100;;;99:1;94:3;90:11;84:18;80:1;75:3;71:11;64:39;52:2;49:1;45:10;40:15;;8:100;;;12:14;910:661:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;19:11:-1;14:3;11:20;8:2;;;44:1;41;34:12;8:2;71:11;66:3;62:21;55:28;;123:4;118:3;114:14;159:9;141:16;138:31;135:2;;;182:1;179;172:12;135:2;219:3;213:10;330:9;325:1;311:12;307:20;289:16;285:43;282:58;261:11;247:12;244:29;233:115;230:2;;;361:1;358;351:12;230:2;384:12;379:3;372:25;420:4;415:3;411:14;404:21;;0:432;;910:661:0;;;;;;;;;;23:1:-1;8:100;33:3;30:1;27:10;8:100;;;99:1;94:3;90:11;84:18;80:1;75:3;71:11;64:39;52:2;49:1;45:10;40:15;;8:100;;;12:14;910:661:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1106:14;1083:8;:20;1092:10;1083:20;;;;;;;;;;;;;;;:37;;;;1198:14;1184:11;:28;;;;1276:10;1269:4;:17;;;;;;;;;;;;:::i;:::-;;1379:13;1368:8;;:24;;;;;;;;;;;;;;;;;;1482:12;1473:6;:21;;;;;;;;;;;;:::i;:::-;;910:661;;;;179:2794;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;",
    "deployedSourceMap": "179:2794:0:-;;;;8:9:-1;5:2;;;30:1;27;20:12;5:2;179:2794:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;697:18;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;23:1:-1;8:100;33:3;30:1;27:10;8:100;;;99:1;94:3;90:11;84:18;80:1;75:3;71:11;64:39;52:2;49:1;45:10;40:15;;8:100;;;12:14;697:18:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2558:260;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;2558:260:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;661:26:1;;;:::i;:::-;;;;;;;;;;;;;;;;;;;1914:513:0;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;1914:513:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;282:44;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;282:44:0;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;769:21;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;333:64;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;333:64:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;2435:115;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;2435:115:0;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;841:20;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;23:1:-1;8:100;33:3;30:1;27:10;8:100;;;99:1;94:3;90:11;84:18;80:1;75:3;71:11;64:39;52:2;49:1;45:10;40:15;;8:100;;;12:14;841:20:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1579:327;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;1579:327:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;2826:144;;;;;;13:2:-1;8:3;5:11;2:2;;;29:1;26;19:12;2:2;2826:144:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;697:18;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;2558:260::-;2625:12;2682:6;2650:7;:19;2658:10;2650:19;;;;;;;;;;;;;;;:29;2670:8;2650:29;;;;;;;;;;;;;;;:38;;;;2725:8;2704:38;;2713:10;2704:38;;;2735:6;2704:38;;;;;;;;;;;;;;;;;;2806:4;2799:11;;2558:260;;;;:::o;661:26:1:-;;;;:::o;1914:513:0:-;1996:12;2021:17;2041:7;:14;2049:5;2041:14;;;;;;;;;;;;;;;:26;2056:10;2041:26;;;;;;;;;;;;;;;;2021:46;;2105:6;2086:8;:15;2095:5;2086:15;;;;;;;;;;;;;;;;:25;;:48;;;;;2128:6;2115:9;:19;;2086:48;2078:57;;;;;;2163:6;2146:8;:13;2155:3;2146:13;;;;;;;;;;;;;;;;:23;;;;;;;;;;;2199:6;2180:8;:15;2189:5;2180:15;;;;;;;;;;;;;;;;:25;;;;;;;;;;;265:10;2220:9;:23;2216:92;;;2290:6;2260:7;:14;2268:5;2260:14;;;;;;;;;;;;;;;:26;2275:10;2260:26;;;;;;;;;;;;;;;;:36;;;;;;;;;;;2216:92;2339:3;2323:28;;2332:5;2323:28;;;2344:6;2323:28;;;;;;;;;;;;;;;;;;2415:4;2408:11;;;1914:513;;;;;:::o;282:44::-;;;;;;;;;;;;;;;;;:::o;769:21::-;;;;;;;;;;;;;:::o;333:64::-;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;2435:115::-;2491:15;2526:8;:16;2535:6;2526:16;;;;;;;;;;;;;;;;2519:23;;2435:115;;;:::o;841:20::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;1579:327::-;1642:12;1699:6;1675:8;:20;1684:10;1675:20;;;;;;;;;;;;;;;;:30;;1667:39;;;;;;1741:6;1717:8;:20;1726:10;1717:20;;;;;;;;;;;;;;;;:30;;;;;;;;;;;1775:6;1758:8;:13;1767:3;1758:13;;;;;;;;;;;;;;;;:23;;;;;;;;;;;1818:3;1797:33;;1806:10;1797:33;;;1823:6;1797:33;;;;;;;;;;;;;;;;;;1894:4;1887:11;;1579:327;;;;:::o;2826:144::-;2900:17;2937:7;:15;2945:6;2937:15;;;;;;;;;;;;;;;:25;2953:8;2937:25;;;;;;;;;;;;;;;;2930:32;;2826:144;;;;:::o",
    "source": "/*\r\nImplements EIP20 token standard: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md\r\n.*/\r\n\r\n\r\npragma solidity >=0.4.22 <0.8.0;\r\n\r\nimport \"./EIP20Interface.sol\";\r\n\r\n\r\ncontract BestToking is EIP20Interface {\r\n\r\n    uint256 constant private MAX_UINT256 = 2**256 - 1;\r\n    mapping (address => uint256) public balances;\r\n    mapping (address => mapping (address => uint256)) public allowed;\r\n    /*\r\n    NOTE:\r\n    The following variables are OPTIONAL vanities. One does not have to include them.\r\n    They allow one to customise the token contract & in no way influences the core functionality.\r\n    Some wallets/interfaces might not even bother to look at this information.\r\n    */\r\n    string public name;                   //fancy name: eg Simon Bucks\r\n    uint8 public decimals;                //How many decimals to show.\r\n    string public symbol;                 //An identifier: eg SBX\r\n\r\n    constructor (\r\n        uint256 _initialAmount,\r\n        string memory _tokenName,\r\n        uint8 _decimalUnits,\r\n        string memory _tokenSymbol\r\n    ) public {\r\n        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens\r\n        totalSupply = _initialAmount;                        // Update total supply\r\n        name = _tokenName;                                   // Set the name for display purposes\r\n        decimals = _decimalUnits;                            // Amount of decimals for display purposes\r\n        symbol = _tokenSymbol;                               // Set the symbol for display purposes\r\n    }\r\n\r\n    function transfer(address _to, uint256 _value) public returns (bool success) {\r\n        require(balances[msg.sender] >= _value);\r\n        balances[msg.sender] -= _value;\r\n        balances[_to] += _value;\r\n        emit Transfer(msg.sender, _to, _value); //solhint-disable-line indent, no-unused-vars\r\n        return true;\r\n    }\r\n\r\n    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {\r\n        uint256 allowance = allowed[_from][msg.sender];\r\n        require(balances[_from] >= _value && allowance >= _value);\r\n        balances[_to] += _value;\r\n        balances[_from] -= _value;\r\n        if (allowance < MAX_UINT256) {\r\n            allowed[_from][msg.sender] -= _value;\r\n        }\r\n        emit Transfer(_from, _to, _value); //solhint-disable-line indent, no-unused-vars\r\n        return true;\r\n    }\r\n\r\n    function balanceOf(address _owner) public view returns (uint256 balance) {\r\n        return balances[_owner];\r\n    }\r\n\r\n    function approve(address _spender, uint256 _value) public returns (bool success) {\r\n        allowed[msg.sender][_spender] = _value;\r\n        emit Approval(msg.sender, _spender, _value); //solhint-disable-line indent, no-unused-vars\r\n        return true;\r\n    }\r\n\r\n    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {\r\n        return allowed[_owner][_spender];\r\n    }\r\n}",
    "sourcePath": "C:/Users/chris/Desktop/Dapp/dapp2/election/contracts/BestToking.sol",
    "ast": {
        "absolutePath": "/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/BestToking.sol",
        "exportedSymbols": {
            "BestToking": [
                227
            ]
        },
        "id": 228,
        "nodeType": "SourceUnit",
        "nodes": [{
                "id": 1,
                "literals": [
                    "solidity",
                    ">=",
                    "0.4",
                    ".22",
                    "<",
                    "0.8",
                    ".0"
                ],
                "nodeType": "PragmaDirective",
                "src": "107:32:0"
            },
            {
                "absolutePath": "/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/EIP20Interface.sol",
                "file": "./EIP20Interface.sol",
                "id": 2,
                "nodeType": "ImportDirective",
                "scope": 228,
                "sourceUnit": 294,
                "src": "143:30:0",
                "symbolAliases": [],
                "unitAlias": ""
            },
            {
                "baseContracts": [{
                    "arguments": null,
                    "baseName": {
                        "contractScope": null,
                        "id": 3,
                        "name": "EIP20Interface",
                        "nodeType": "UserDefinedTypeName",
                        "referencedDeclaration": 293,
                        "src": "202:14:0",
                        "typeDescriptions": {
                            "typeIdentifier": "t_contract$_EIP20Interface_$293",
                            "typeString": "contract EIP20Interface"
                        }
                    },
                    "id": 4,
                    "nodeType": "InheritanceSpecifier",
                    "src": "202:14:0"
                }],
                "contractDependencies": [
                    293
                ],
                "contractKind": "contract",
                "documentation": null,
                "fullyImplemented": true,
                "id": 227,
                "linearizedBaseContracts": [
                    227,
                    293
                ],
                "name": "BestToking",
                "nodeType": "ContractDefinition",
                "nodes": [{
                        "constant": true,
                        "id": 11,
                        "name": "MAX_UINT256",
                        "nodeType": "VariableDeclaration",
                        "scope": 227,
                        "src": "226:49:0",
                        "stateVariable": true,
                        "storageLocation": "default",
                        "typeDescriptions": {
                            "typeIdentifier": "t_uint256",
                            "typeString": "uint256"
                        },
                        "typeName": {
                            "id": 5,
                            "name": "uint256",
                            "nodeType": "ElementaryTypeName",
                            "src": "226:7:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_uint256",
                                "typeString": "uint256"
                            }
                        },
                        "value": {
                            "argumentTypes": null,
                            "commonType": {
                                "typeIdentifier": "t_rational_115792089237316195423570985008687907853269984665640564039457584007913129639935_by_1",
                                "typeString": "int_const 1157...(70 digits omitted)...9935"
                            },
                            "id": 10,
                            "isConstant": false,
                            "isLValue": false,
                            "isPure": true,
                            "lValueRequested": false,
                            "leftExpression": {
                                "argumentTypes": null,
                                "commonType": {
                                    "typeIdentifier": "t_rational_115792089237316195423570985008687907853269984665640564039457584007913129639936_by_1",
                                    "typeString": "int_const 1157...(70 digits omitted)...9936"
                                },
                                "id": 8,
                                "isConstant": false,
                                "isLValue": false,
                                "isPure": true,
                                "lValueRequested": false,
                                "leftExpression": {
                                    "argumentTypes": null,
                                    "hexValue": "32",
                                    "id": 6,
                                    "isConstant": false,
                                    "isLValue": false,
                                    "isPure": true,
                                    "kind": "number",
                                    "lValueRequested": false,
                                    "nodeType": "Literal",
                                    "src": "265:1:0",
                                    "subdenomination": null,
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_rational_2_by_1",
                                        "typeString": "int_const 2"
                                    },
                                    "value": "2"
                                },
                                "nodeType": "BinaryOperation",
                                "operator": "**",
                                "rightExpression": {
                                    "argumentTypes": null,
                                    "hexValue": "323536",
                                    "id": 7,
                                    "isConstant": false,
                                    "isLValue": false,
                                    "isPure": true,
                                    "kind": "number",
                                    "lValueRequested": false,
                                    "nodeType": "Literal",
                                    "src": "268:3:0",
                                    "subdenomination": null,
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_rational_256_by_1",
                                        "typeString": "int_const 256"
                                    },
                                    "value": "256"
                                },
                                "src": "265:6:0",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_rational_115792089237316195423570985008687907853269984665640564039457584007913129639936_by_1",
                                    "typeString": "int_const 1157...(70 digits omitted)...9936"
                                }
                            },
                            "nodeType": "BinaryOperation",
                            "operator": "-",
                            "rightExpression": {
                                "argumentTypes": null,
                                "hexValue": "31",
                                "id": 9,
                                "isConstant": false,
                                "isLValue": false,
                                "isPure": true,
                                "kind": "number",
                                "lValueRequested": false,
                                "nodeType": "Literal",
                                "src": "274:1:0",
                                "subdenomination": null,
                                "typeDescriptions": {
                                    "typeIdentifier": "t_rational_1_by_1",
                                    "typeString": "int_const 1"
                                },
                                "value": "1"
                            },
                            "src": "265:10:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_rational_115792089237316195423570985008687907853269984665640564039457584007913129639935_by_1",
                                "typeString": "int_const 1157...(70 digits omitted)...9935"
                            }
                        },
                        "visibility": "private"
                    },
                    {
                        "constant": false,
                        "id": 15,
                        "name": "balances",
                        "nodeType": "VariableDeclaration",
                        "scope": 227,
                        "src": "282:44:0",
                        "stateVariable": true,
                        "storageLocation": "default",
                        "typeDescriptions": {
                            "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                            "typeString": "mapping(address => uint256)"
                        },
                        "typeName": {
                            "id": 14,
                            "keyType": {
                                "id": 12,
                                "name": "address",
                                "nodeType": "ElementaryTypeName",
                                "src": "291:7:0",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_address",
                                    "typeString": "address"
                                }
                            },
                            "nodeType": "Mapping",
                            "src": "282:28:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                "typeString": "mapping(address => uint256)"
                            },
                            "valueType": {
                                "id": 13,
                                "name": "uint256",
                                "nodeType": "ElementaryTypeName",
                                "src": "302:7:0",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_uint256",
                                    "typeString": "uint256"
                                }
                            }
                        },
                        "value": null,
                        "visibility": "public"
                    },
                    {
                        "constant": false,
                        "id": 21,
                        "name": "allowed",
                        "nodeType": "VariableDeclaration",
                        "scope": 227,
                        "src": "333:64:0",
                        "stateVariable": true,
                        "storageLocation": "default",
                        "typeDescriptions": {
                            "typeIdentifier": "t_mapping$_t_address_$_t_mapping$_t_address_$_t_uint256_$_$",
                            "typeString": "mapping(address => mapping(address => uint256))"
                        },
                        "typeName": {
                            "id": 20,
                            "keyType": {
                                "id": 16,
                                "name": "address",
                                "nodeType": "ElementaryTypeName",
                                "src": "342:7:0",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_address",
                                    "typeString": "address"
                                }
                            },
                            "nodeType": "Mapping",
                            "src": "333:49:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_mapping$_t_address_$_t_mapping$_t_address_$_t_uint256_$_$",
                                "typeString": "mapping(address => mapping(address => uint256))"
                            },
                            "valueType": {
                                "id": 19,
                                "keyType": {
                                    "id": 17,
                                    "name": "address",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "362:7:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    }
                                },
                                "nodeType": "Mapping",
                                "src": "353:28:0",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                    "typeString": "mapping(address => uint256)"
                                },
                                "valueType": {
                                    "id": 18,
                                    "name": "uint256",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "373:7:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    }
                                }
                            }
                        },
                        "value": null,
                        "visibility": "public"
                    },
                    {
                        "constant": false,
                        "id": 23,
                        "name": "name",
                        "nodeType": "VariableDeclaration",
                        "scope": 227,
                        "src": "697:18:0",
                        "stateVariable": true,
                        "storageLocation": "default",
                        "typeDescriptions": {
                            "typeIdentifier": "t_string_storage",
                            "typeString": "string"
                        },
                        "typeName": {
                            "id": 22,
                            "name": "string",
                            "nodeType": "ElementaryTypeName",
                            "src": "697:6:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_string_storage_ptr",
                                "typeString": "string"
                            }
                        },
                        "value": null,
                        "visibility": "public"
                    },
                    {
                        "constant": false,
                        "id": 25,
                        "name": "decimals",
                        "nodeType": "VariableDeclaration",
                        "scope": 227,
                        "src": "769:21:0",
                        "stateVariable": true,
                        "storageLocation": "default",
                        "typeDescriptions": {
                            "typeIdentifier": "t_uint8",
                            "typeString": "uint8"
                        },
                        "typeName": {
                            "id": 24,
                            "name": "uint8",
                            "nodeType": "ElementaryTypeName",
                            "src": "769:5:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_uint8",
                                "typeString": "uint8"
                            }
                        },
                        "value": null,
                        "visibility": "public"
                    },
                    {
                        "constant": false,
                        "id": 27,
                        "name": "symbol",
                        "nodeType": "VariableDeclaration",
                        "scope": 227,
                        "src": "841:20:0",
                        "stateVariable": true,
                        "storageLocation": "default",
                        "typeDescriptions": {
                            "typeIdentifier": "t_string_storage",
                            "typeString": "string"
                        },
                        "typeName": {
                            "id": 26,
                            "name": "string",
                            "nodeType": "ElementaryTypeName",
                            "src": "841:6:0",
                            "typeDescriptions": {
                                "typeIdentifier": "t_string_storage_ptr",
                                "typeString": "string"
                            }
                        },
                        "value": null,
                        "visibility": "public"
                    },
                    {
                        "body": {
                            "id": 61,
                            "nodeType": "Block",
                            "src": "1072:499:0",
                            "statements": [{
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 43,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "id": 38,
                                                "name": "balances",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 15,
                                                "src": "1083:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                    "typeString": "mapping(address => uint256)"
                                                }
                                            },
                                            "id": 41,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "expression": {
                                                    "argumentTypes": null,
                                                    "id": 39,
                                                    "name": "msg",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 457,
                                                    "src": "1092:3:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_magic_message",
                                                        "typeString": "msg"
                                                    }
                                                },
                                                "id": 40,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "memberName": "sender",
                                                "nodeType": "MemberAccess",
                                                "referencedDeclaration": null,
                                                "src": "1092:10:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address_payable",
                                                    "typeString": "address payable"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": true,
                                            "nodeType": "IndexAccess",
                                            "src": "1083:20:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 42,
                                            "name": "_initialAmount",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 29,
                                            "src": "1106:14:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "1083:37:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 44,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1083:37:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 47,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "id": 45,
                                            "name": "totalSupply",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 231,
                                            "src": "1184:11:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 46,
                                            "name": "_initialAmount",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 29,
                                            "src": "1198:14:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "1184:28:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 48,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1184:28:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 51,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "id": 49,
                                            "name": "name",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 23,
                                            "src": "1269:4:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_string_storage",
                                                "typeString": "string storage ref"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 50,
                                            "name": "_tokenName",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 31,
                                            "src": "1276:10:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_string_memory_ptr",
                                                "typeString": "string memory"
                                            }
                                        },
                                        "src": "1269:17:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_string_storage",
                                            "typeString": "string storage ref"
                                        }
                                    },
                                    "id": 52,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1269:17:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 55,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "id": 53,
                                            "name": "decimals",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 25,
                                            "src": "1368:8:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint8",
                                                "typeString": "uint8"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 54,
                                            "name": "_decimalUnits",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 33,
                                            "src": "1379:13:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint8",
                                                "typeString": "uint8"
                                            }
                                        },
                                        "src": "1368:24:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint8",
                                            "typeString": "uint8"
                                        }
                                    },
                                    "id": 56,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1368:24:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 59,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "id": 57,
                                            "name": "symbol",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 27,
                                            "src": "1473:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_string_storage",
                                                "typeString": "string storage ref"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 58,
                                            "name": "_tokenSymbol",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 35,
                                            "src": "1482:12:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_string_memory_ptr",
                                                "typeString": "string memory"
                                            }
                                        },
                                        "src": "1473:21:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_string_storage",
                                            "typeString": "string storage ref"
                                        }
                                    },
                                    "id": 60,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1473:21:0"
                                }
                            ]
                        },
                        "documentation": null,
                        "id": 62,
                        "implemented": true,
                        "kind": "constructor",
                        "modifiers": [],
                        "name": "",
                        "nodeType": "FunctionDefinition",
                        "parameters": {
                            "id": 36,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                    "constant": false,
                                    "id": 29,
                                    "name": "_initialAmount",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 62,
                                    "src": "933:22:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    },
                                    "typeName": {
                                        "id": 28,
                                        "name": "uint256",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "933:7:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 31,
                                    "name": "_tokenName",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 62,
                                    "src": "966:24:0",
                                    "stateVariable": false,
                                    "storageLocation": "memory",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_string_memory_ptr",
                                        "typeString": "string"
                                    },
                                    "typeName": {
                                        "id": 30,
                                        "name": "string",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "966:6:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_string_storage_ptr",
                                            "typeString": "string"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 33,
                                    "name": "_decimalUnits",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 62,
                                    "src": "1001:19:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint8",
                                        "typeString": "uint8"
                                    },
                                    "typeName": {
                                        "id": 32,
                                        "name": "uint8",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1001:5:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint8",
                                            "typeString": "uint8"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 35,
                                    "name": "_tokenSymbol",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 62,
                                    "src": "1031:26:0",
                                    "stateVariable": false,
                                    "storageLocation": "memory",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_string_memory_ptr",
                                        "typeString": "string"
                                    },
                                    "typeName": {
                                        "id": 34,
                                        "name": "string",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1031:6:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_string_storage_ptr",
                                            "typeString": "string"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                }
                            ],
                            "src": "922:142:0"
                        },
                        "returnParameters": {
                            "id": 37,
                            "nodeType": "ParameterList",
                            "parameters": [],
                            "src": "1072:0:0"
                        },
                        "scope": 227,
                        "src": "910:661:0",
                        "stateMutability": "nonpayable",
                        "superFunction": null,
                        "visibility": "public"
                    },
                    {
                        "body": {
                            "id": 102,
                            "nodeType": "Block",
                            "src": "1656:250:0",
                            "statements": [{
                                    "expression": {
                                        "argumentTypes": null,
                                        "arguments": [{
                                            "argumentTypes": null,
                                            "commonType": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            },
                                            "id": 77,
                                            "isConstant": false,
                                            "isLValue": false,
                                            "isPure": false,
                                            "lValueRequested": false,
                                            "leftExpression": {
                                                "argumentTypes": null,
                                                "baseExpression": {
                                                    "argumentTypes": null,
                                                    "id": 72,
                                                    "name": "balances",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 15,
                                                    "src": "1675:8:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                        "typeString": "mapping(address => uint256)"
                                                    }
                                                },
                                                "id": 75,
                                                "indexExpression": {
                                                    "argumentTypes": null,
                                                    "expression": {
                                                        "argumentTypes": null,
                                                        "id": 73,
                                                        "name": "msg",
                                                        "nodeType": "Identifier",
                                                        "overloadedDeclarations": [],
                                                        "referencedDeclaration": 457,
                                                        "src": "1684:3:0",
                                                        "typeDescriptions": {
                                                            "typeIdentifier": "t_magic_message",
                                                            "typeString": "msg"
                                                        }
                                                    },
                                                    "id": 74,
                                                    "isConstant": false,
                                                    "isLValue": false,
                                                    "isPure": false,
                                                    "lValueRequested": false,
                                                    "memberName": "sender",
                                                    "nodeType": "MemberAccess",
                                                    "referencedDeclaration": null,
                                                    "src": "1684:10:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_address_payable",
                                                        "typeString": "address payable"
                                                    }
                                                },
                                                "isConstant": false,
                                                "isLValue": true,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "nodeType": "IndexAccess",
                                                "src": "1675:20:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            },
                                            "nodeType": "BinaryOperation",
                                            "operator": ">=",
                                            "rightExpression": {
                                                "argumentTypes": null,
                                                "id": 76,
                                                "name": "_value",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 66,
                                                "src": "1699:6:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            },
                                            "src": "1675:30:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_bool",
                                                "typeString": "bool"
                                            }
                                        }],
                                        "expression": {
                                            "argumentTypes": [{
                                                "typeIdentifier": "t_bool",
                                                "typeString": "bool"
                                            }],
                                            "id": 71,
                                            "name": "require",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [
                                                460,
                                                461
                                            ],
                                            "referencedDeclaration": 460,
                                            "src": "1667:7:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_function_require_pure$_t_bool_$returns$__$",
                                                "typeString": "function (bool) pure"
                                            }
                                        },
                                        "id": 78,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "kind": "functionCall",
                                        "lValueRequested": false,
                                        "names": [],
                                        "nodeType": "FunctionCall",
                                        "src": "1667:39:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_tuple$__$",
                                            "typeString": "tuple()"
                                        }
                                    },
                                    "id": 79,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1667:39:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 85,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "id": 80,
                                                "name": "balances",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 15,
                                                "src": "1717:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                    "typeString": "mapping(address => uint256)"
                                                }
                                            },
                                            "id": 83,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "expression": {
                                                    "argumentTypes": null,
                                                    "id": 81,
                                                    "name": "msg",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 457,
                                                    "src": "1726:3:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_magic_message",
                                                        "typeString": "msg"
                                                    }
                                                },
                                                "id": 82,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "memberName": "sender",
                                                "nodeType": "MemberAccess",
                                                "referencedDeclaration": null,
                                                "src": "1726:10:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address_payable",
                                                    "typeString": "address payable"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": true,
                                            "nodeType": "IndexAccess",
                                            "src": "1717:20:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "-=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 84,
                                            "name": "_value",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 66,
                                            "src": "1741:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "1717:30:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 86,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1717:30:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 91,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "id": 87,
                                                "name": "balances",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 15,
                                                "src": "1758:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                    "typeString": "mapping(address => uint256)"
                                                }
                                            },
                                            "id": 89,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "id": 88,
                                                "name": "_to",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 64,
                                                "src": "1767:3:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": true,
                                            "nodeType": "IndexAccess",
                                            "src": "1758:13:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "+=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 90,
                                            "name": "_value",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 66,
                                            "src": "1775:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "1758:23:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 92,
                                    "nodeType": "ExpressionStatement",
                                    "src": "1758:23:0"
                                },
                                {
                                    "eventCall": {
                                        "argumentTypes": null,
                                        "arguments": [{
                                                "argumentTypes": null,
                                                "expression": {
                                                    "argumentTypes": null,
                                                    "id": 94,
                                                    "name": "msg",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 457,
                                                    "src": "1806:3:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_magic_message",
                                                        "typeString": "msg"
                                                    }
                                                },
                                                "id": 95,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "memberName": "sender",
                                                "nodeType": "MemberAccess",
                                                "referencedDeclaration": null,
                                                "src": "1806:10:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address_payable",
                                                    "typeString": "address payable"
                                                }
                                            },
                                            {
                                                "argumentTypes": null,
                                                "id": 96,
                                                "name": "_to",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 64,
                                                "src": "1818:3:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            {
                                                "argumentTypes": null,
                                                "id": 97,
                                                "name": "_value",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 66,
                                                "src": "1823:6:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            }
                                        ],
                                        "expression": {
                                            "argumentTypes": [{
                                                    "typeIdentifier": "t_address_payable",
                                                    "typeString": "address payable"
                                                },
                                                {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                },
                                                {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            ],
                                            "id": 93,
                                            "name": "Transfer",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 284,
                                            "src": "1797:8:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_function_event_nonpayable$_t_address_$_t_address_$_t_uint256_$returns$__$",
                                                "typeString": "function (address,address,uint256)"
                                            }
                                        },
                                        "id": 98,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "kind": "functionCall",
                                        "lValueRequested": false,
                                        "names": [],
                                        "nodeType": "FunctionCall",
                                        "src": "1797:33:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_tuple$__$",
                                            "typeString": "tuple()"
                                        }
                                    },
                                    "id": 99,
                                    "nodeType": "EmitStatement",
                                    "src": "1792:38:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "hexValue": "74727565",
                                        "id": 100,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": true,
                                        "kind": "bool",
                                        "lValueRequested": false,
                                        "nodeType": "Literal",
                                        "src": "1894:4:0",
                                        "subdenomination": null,
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_bool",
                                            "typeString": "bool"
                                        },
                                        "value": "true"
                                    },
                                    "functionReturnParameters": 70,
                                    "id": 101,
                                    "nodeType": "Return",
                                    "src": "1887:11:0"
                                }
                            ]
                        },
                        "documentation": null,
                        "id": 103,
                        "implemented": true,
                        "kind": "function",
                        "modifiers": [],
                        "name": "transfer",
                        "nodeType": "FunctionDefinition",
                        "parameters": {
                            "id": 67,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                    "constant": false,
                                    "id": 64,
                                    "name": "_to",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 103,
                                    "src": "1597:11:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    },
                                    "typeName": {
                                        "id": 63,
                                        "name": "address",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1597:7:0",
                                        "stateMutability": "nonpayable",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 66,
                                    "name": "_value",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 103,
                                    "src": "1610:14:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    },
                                    "typeName": {
                                        "id": 65,
                                        "name": "uint256",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1610:7:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                }
                            ],
                            "src": "1596:29:0"
                        },
                        "returnParameters": {
                            "id": 70,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                "constant": false,
                                "id": 69,
                                "name": "success",
                                "nodeType": "VariableDeclaration",
                                "scope": 103,
                                "src": "1642:12:0",
                                "stateVariable": false,
                                "storageLocation": "default",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_bool",
                                    "typeString": "bool"
                                },
                                "typeName": {
                                    "id": 68,
                                    "name": "bool",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "1642:4:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_bool",
                                        "typeString": "bool"
                                    }
                                },
                                "value": null,
                                "visibility": "internal"
                            }],
                            "src": "1641:14:0"
                        },
                        "scope": 227,
                        "src": "1579:327:0",
                        "stateMutability": "nonpayable",
                        "superFunction": 247,
                        "visibility": "public"
                    },
                    {
                        "body": {
                            "id": 169,
                            "nodeType": "Block",
                            "src": "2010:417:0",
                            "statements": [{
                                    "assignments": [
                                        115
                                    ],
                                    "declarations": [{
                                        "constant": false,
                                        "id": 115,
                                        "name": "allowance",
                                        "nodeType": "VariableDeclaration",
                                        "scope": 169,
                                        "src": "2021:17:0",
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        },
                                        "typeName": {
                                            "id": 114,
                                            "name": "uint256",
                                            "nodeType": "ElementaryTypeName",
                                            "src": "2021:7:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "value": null,
                                        "visibility": "internal"
                                    }],
                                    "id": 122,
                                    "initialValue": {
                                        "argumentTypes": null,
                                        "baseExpression": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "id": 116,
                                                "name": "allowed",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 21,
                                                "src": "2041:7:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_mapping$_t_address_$_t_uint256_$_$",
                                                    "typeString": "mapping(address => mapping(address => uint256))"
                                                }
                                            },
                                            "id": 118,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "id": 117,
                                                "name": "_from",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 105,
                                                "src": "2049:5:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": false,
                                            "nodeType": "IndexAccess",
                                            "src": "2041:14:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                "typeString": "mapping(address => uint256)"
                                            }
                                        },
                                        "id": 121,
                                        "indexExpression": {
                                            "argumentTypes": null,
                                            "expression": {
                                                "argumentTypes": null,
                                                "id": 119,
                                                "name": "msg",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 457,
                                                "src": "2056:3:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_magic_message",
                                                    "typeString": "msg"
                                                }
                                            },
                                            "id": 120,
                                            "isConstant": false,
                                            "isLValue": false,
                                            "isPure": false,
                                            "lValueRequested": false,
                                            "memberName": "sender",
                                            "nodeType": "MemberAccess",
                                            "referencedDeclaration": null,
                                            "src": "2056:10:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_address_payable",
                                                "typeString": "address payable"
                                            }
                                        },
                                        "isConstant": false,
                                        "isLValue": true,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "nodeType": "IndexAccess",
                                        "src": "2041:26:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "nodeType": "VariableDeclarationStatement",
                                    "src": "2021:46:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "arguments": [{
                                            "argumentTypes": null,
                                            "commonType": {
                                                "typeIdentifier": "t_bool",
                                                "typeString": "bool"
                                            },
                                            "id": 132,
                                            "isConstant": false,
                                            "isLValue": false,
                                            "isPure": false,
                                            "lValueRequested": false,
                                            "leftExpression": {
                                                "argumentTypes": null,
                                                "commonType": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                },
                                                "id": 128,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "leftExpression": {
                                                    "argumentTypes": null,
                                                    "baseExpression": {
                                                        "argumentTypes": null,
                                                        "id": 124,
                                                        "name": "balances",
                                                        "nodeType": "Identifier",
                                                        "overloadedDeclarations": [],
                                                        "referencedDeclaration": 15,
                                                        "src": "2086:8:0",
                                                        "typeDescriptions": {
                                                            "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                            "typeString": "mapping(address => uint256)"
                                                        }
                                                    },
                                                    "id": 126,
                                                    "indexExpression": {
                                                        "argumentTypes": null,
                                                        "id": 125,
                                                        "name": "_from",
                                                        "nodeType": "Identifier",
                                                        "overloadedDeclarations": [],
                                                        "referencedDeclaration": 105,
                                                        "src": "2095:5:0",
                                                        "typeDescriptions": {
                                                            "typeIdentifier": "t_address",
                                                            "typeString": "address"
                                                        }
                                                    },
                                                    "isConstant": false,
                                                    "isLValue": true,
                                                    "isPure": false,
                                                    "lValueRequested": false,
                                                    "nodeType": "IndexAccess",
                                                    "src": "2086:15:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    }
                                                },
                                                "nodeType": "BinaryOperation",
                                                "operator": ">=",
                                                "rightExpression": {
                                                    "argumentTypes": null,
                                                    "id": 127,
                                                    "name": "_value",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 109,
                                                    "src": "2105:6:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    }
                                                },
                                                "src": "2086:25:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_bool",
                                                    "typeString": "bool"
                                                }
                                            },
                                            "nodeType": "BinaryOperation",
                                            "operator": "&&",
                                            "rightExpression": {
                                                "argumentTypes": null,
                                                "commonType": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                },
                                                "id": 131,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "leftExpression": {
                                                    "argumentTypes": null,
                                                    "id": 129,
                                                    "name": "allowance",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 115,
                                                    "src": "2115:9:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    }
                                                },
                                                "nodeType": "BinaryOperation",
                                                "operator": ">=",
                                                "rightExpression": {
                                                    "argumentTypes": null,
                                                    "id": 130,
                                                    "name": "_value",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 109,
                                                    "src": "2128:6:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    }
                                                },
                                                "src": "2115:19:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_bool",
                                                    "typeString": "bool"
                                                }
                                            },
                                            "src": "2086:48:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_bool",
                                                "typeString": "bool"
                                            }
                                        }],
                                        "expression": {
                                            "argumentTypes": [{
                                                "typeIdentifier": "t_bool",
                                                "typeString": "bool"
                                            }],
                                            "id": 123,
                                            "name": "require",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [
                                                460,
                                                461
                                            ],
                                            "referencedDeclaration": 460,
                                            "src": "2078:7:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_function_require_pure$_t_bool_$returns$__$",
                                                "typeString": "function (bool) pure"
                                            }
                                        },
                                        "id": 133,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "kind": "functionCall",
                                        "lValueRequested": false,
                                        "names": [],
                                        "nodeType": "FunctionCall",
                                        "src": "2078:57:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_tuple$__$",
                                            "typeString": "tuple()"
                                        }
                                    },
                                    "id": 134,
                                    "nodeType": "ExpressionStatement",
                                    "src": "2078:57:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 139,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "id": 135,
                                                "name": "balances",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 15,
                                                "src": "2146:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                    "typeString": "mapping(address => uint256)"
                                                }
                                            },
                                            "id": 137,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "id": 136,
                                                "name": "_to",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 107,
                                                "src": "2155:3:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": true,
                                            "nodeType": "IndexAccess",
                                            "src": "2146:13:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "+=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 138,
                                            "name": "_value",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 109,
                                            "src": "2163:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "2146:23:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 140,
                                    "nodeType": "ExpressionStatement",
                                    "src": "2146:23:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 145,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "id": 141,
                                                "name": "balances",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 15,
                                                "src": "2180:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                    "typeString": "mapping(address => uint256)"
                                                }
                                            },
                                            "id": 143,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "id": 142,
                                                "name": "_from",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 105,
                                                "src": "2189:5:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": true,
                                            "nodeType": "IndexAccess",
                                            "src": "2180:15:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "-=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 144,
                                            "name": "_value",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 109,
                                            "src": "2199:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "2180:25:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 146,
                                    "nodeType": "ExpressionStatement",
                                    "src": "2180:25:0"
                                },
                                {
                                    "condition": {
                                        "argumentTypes": null,
                                        "commonType": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        },
                                        "id": 149,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftExpression": {
                                            "argumentTypes": null,
                                            "id": 147,
                                            "name": "allowance",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 115,
                                            "src": "2220:9:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "BinaryOperation",
                                        "operator": "<",
                                        "rightExpression": {
                                            "argumentTypes": null,
                                            "id": 148,
                                            "name": "MAX_UINT256",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 11,
                                            "src": "2232:11:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "2220:23:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_bool",
                                            "typeString": "bool"
                                        }
                                    },
                                    "falseBody": null,
                                    "id": 160,
                                    "nodeType": "IfStatement",
                                    "src": "2216:92:0",
                                    "trueBody": {
                                        "id": 159,
                                        "nodeType": "Block",
                                        "src": "2245:63:0",
                                        "statements": [{
                                            "expression": {
                                                "argumentTypes": null,
                                                "id": 157,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "leftHandSide": {
                                                    "argumentTypes": null,
                                                    "baseExpression": {
                                                        "argumentTypes": null,
                                                        "baseExpression": {
                                                            "argumentTypes": null,
                                                            "id": 150,
                                                            "name": "allowed",
                                                            "nodeType": "Identifier",
                                                            "overloadedDeclarations": [],
                                                            "referencedDeclaration": 21,
                                                            "src": "2260:7:0",
                                                            "typeDescriptions": {
                                                                "typeIdentifier": "t_mapping$_t_address_$_t_mapping$_t_address_$_t_uint256_$_$",
                                                                "typeString": "mapping(address => mapping(address => uint256))"
                                                            }
                                                        },
                                                        "id": 154,
                                                        "indexExpression": {
                                                            "argumentTypes": null,
                                                            "id": 151,
                                                            "name": "_from",
                                                            "nodeType": "Identifier",
                                                            "overloadedDeclarations": [],
                                                            "referencedDeclaration": 105,
                                                            "src": "2268:5:0",
                                                            "typeDescriptions": {
                                                                "typeIdentifier": "t_address",
                                                                "typeString": "address"
                                                            }
                                                        },
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": false,
                                                        "nodeType": "IndexAccess",
                                                        "src": "2260:14:0",
                                                        "typeDescriptions": {
                                                            "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                            "typeString": "mapping(address => uint256)"
                                                        }
                                                    },
                                                    "id": 155,
                                                    "indexExpression": {
                                                        "argumentTypes": null,
                                                        "expression": {
                                                            "argumentTypes": null,
                                                            "id": 152,
                                                            "name": "msg",
                                                            "nodeType": "Identifier",
                                                            "overloadedDeclarations": [],
                                                            "referencedDeclaration": 457,
                                                            "src": "2275:3:0",
                                                            "typeDescriptions": {
                                                                "typeIdentifier": "t_magic_message",
                                                                "typeString": "msg"
                                                            }
                                                        },
                                                        "id": 153,
                                                        "isConstant": false,
                                                        "isLValue": false,
                                                        "isPure": false,
                                                        "lValueRequested": false,
                                                        "memberName": "sender",
                                                        "nodeType": "MemberAccess",
                                                        "referencedDeclaration": null,
                                                        "src": "2275:10:0",
                                                        "typeDescriptions": {
                                                            "typeIdentifier": "t_address_payable",
                                                            "typeString": "address payable"
                                                        }
                                                    },
                                                    "isConstant": false,
                                                    "isLValue": true,
                                                    "isPure": false,
                                                    "lValueRequested": true,
                                                    "nodeType": "IndexAccess",
                                                    "src": "2260:26:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    }
                                                },
                                                "nodeType": "Assignment",
                                                "operator": "-=",
                                                "rightHandSide": {
                                                    "argumentTypes": null,
                                                    "id": 156,
                                                    "name": "_value",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 109,
                                                    "src": "2290:6:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    }
                                                },
                                                "src": "2260:36:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            },
                                            "id": 158,
                                            "nodeType": "ExpressionStatement",
                                            "src": "2260:36:0"
                                        }]
                                    }
                                },
                                {
                                    "eventCall": {
                                        "argumentTypes": null,
                                        "arguments": [{
                                                "argumentTypes": null,
                                                "id": 162,
                                                "name": "_from",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 105,
                                                "src": "2332:5:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            {
                                                "argumentTypes": null,
                                                "id": 163,
                                                "name": "_to",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 107,
                                                "src": "2339:3:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            {
                                                "argumentTypes": null,
                                                "id": 164,
                                                "name": "_value",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 109,
                                                "src": "2344:6:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            }
                                        ],
                                        "expression": {
                                            "argumentTypes": [{
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                },
                                                {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                },
                                                {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            ],
                                            "id": 161,
                                            "name": "Transfer",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 284,
                                            "src": "2323:8:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_function_event_nonpayable$_t_address_$_t_address_$_t_uint256_$returns$__$",
                                                "typeString": "function (address,address,uint256)"
                                            }
                                        },
                                        "id": 165,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "kind": "functionCall",
                                        "lValueRequested": false,
                                        "names": [],
                                        "nodeType": "FunctionCall",
                                        "src": "2323:28:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_tuple$__$",
                                            "typeString": "tuple()"
                                        }
                                    },
                                    "id": 166,
                                    "nodeType": "EmitStatement",
                                    "src": "2318:33:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "hexValue": "74727565",
                                        "id": 167,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": true,
                                        "kind": "bool",
                                        "lValueRequested": false,
                                        "nodeType": "Literal",
                                        "src": "2415:4:0",
                                        "subdenomination": null,
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_bool",
                                            "typeString": "bool"
                                        },
                                        "value": "true"
                                    },
                                    "functionReturnParameters": 113,
                                    "id": 168,
                                    "nodeType": "Return",
                                    "src": "2408:11:0"
                                }
                            ]
                        },
                        "documentation": null,
                        "id": 170,
                        "implemented": true,
                        "kind": "function",
                        "modifiers": [],
                        "name": "transferFrom",
                        "nodeType": "FunctionDefinition",
                        "parameters": {
                            "id": 110,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                    "constant": false,
                                    "id": 105,
                                    "name": "_from",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 170,
                                    "src": "1936:13:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    },
                                    "typeName": {
                                        "id": 104,
                                        "name": "address",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1936:7:0",
                                        "stateMutability": "nonpayable",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 107,
                                    "name": "_to",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 170,
                                    "src": "1951:11:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    },
                                    "typeName": {
                                        "id": 106,
                                        "name": "address",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1951:7:0",
                                        "stateMutability": "nonpayable",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 109,
                                    "name": "_value",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 170,
                                    "src": "1964:14:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    },
                                    "typeName": {
                                        "id": 108,
                                        "name": "uint256",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "1964:7:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                }
                            ],
                            "src": "1935:44:0"
                        },
                        "returnParameters": {
                            "id": 113,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                "constant": false,
                                "id": 112,
                                "name": "success",
                                "nodeType": "VariableDeclaration",
                                "scope": 170,
                                "src": "1996:12:0",
                                "stateVariable": false,
                                "storageLocation": "default",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_bool",
                                    "typeString": "bool"
                                },
                                "typeName": {
                                    "id": 111,
                                    "name": "bool",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "1996:4:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_bool",
                                        "typeString": "bool"
                                    }
                                },
                                "value": null,
                                "visibility": "internal"
                            }],
                            "src": "1995:14:0"
                        },
                        "scope": 227,
                        "src": "1914:513:0",
                        "stateMutability": "nonpayable",
                        "superFunction": 258,
                        "visibility": "public"
                    },
                    {
                        "body": {
                            "id": 181,
                            "nodeType": "Block",
                            "src": "2508:42:0",
                            "statements": [{
                                "expression": {
                                    "argumentTypes": null,
                                    "baseExpression": {
                                        "argumentTypes": null,
                                        "id": 177,
                                        "name": "balances",
                                        "nodeType": "Identifier",
                                        "overloadedDeclarations": [],
                                        "referencedDeclaration": 15,
                                        "src": "2526:8:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                            "typeString": "mapping(address => uint256)"
                                        }
                                    },
                                    "id": 179,
                                    "indexExpression": {
                                        "argumentTypes": null,
                                        "id": 178,
                                        "name": "_owner",
                                        "nodeType": "Identifier",
                                        "overloadedDeclarations": [],
                                        "referencedDeclaration": 172,
                                        "src": "2535:6:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "isConstant": false,
                                    "isLValue": true,
                                    "isPure": false,
                                    "lValueRequested": false,
                                    "nodeType": "IndexAccess",
                                    "src": "2526:16:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    }
                                },
                                "functionReturnParameters": 176,
                                "id": 180,
                                "nodeType": "Return",
                                "src": "2519:23:0"
                            }]
                        },
                        "documentation": null,
                        "id": 182,
                        "implemented": true,
                        "kind": "function",
                        "modifiers": [],
                        "name": "balanceOf",
                        "nodeType": "FunctionDefinition",
                        "parameters": {
                            "id": 173,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                "constant": false,
                                "id": 172,
                                "name": "_owner",
                                "nodeType": "VariableDeclaration",
                                "scope": 182,
                                "src": "2454:14:0",
                                "stateVariable": false,
                                "storageLocation": "default",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_address",
                                    "typeString": "address"
                                },
                                "typeName": {
                                    "id": 171,
                                    "name": "address",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "2454:7:0",
                                    "stateMutability": "nonpayable",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    }
                                },
                                "value": null,
                                "visibility": "internal"
                            }],
                            "src": "2453:16:0"
                        },
                        "returnParameters": {
                            "id": 176,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                "constant": false,
                                "id": 175,
                                "name": "balance",
                                "nodeType": "VariableDeclaration",
                                "scope": 182,
                                "src": "2491:15:0",
                                "stateVariable": false,
                                "storageLocation": "default",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_uint256",
                                    "typeString": "uint256"
                                },
                                "typeName": {
                                    "id": 174,
                                    "name": "uint256",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "2491:7:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    }
                                },
                                "value": null,
                                "visibility": "internal"
                            }],
                            "src": "2490:17:0"
                        },
                        "scope": 227,
                        "src": "2435:115:0",
                        "stateMutability": "view",
                        "superFunction": 238,
                        "visibility": "public"
                    },
                    {
                        "body": {
                            "id": 209,
                            "nodeType": "Block",
                            "src": "2639:179:0",
                            "statements": [{
                                    "expression": {
                                        "argumentTypes": null,
                                        "id": 198,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "leftHandSide": {
                                            "argumentTypes": null,
                                            "baseExpression": {
                                                "argumentTypes": null,
                                                "baseExpression": {
                                                    "argumentTypes": null,
                                                    "id": 191,
                                                    "name": "allowed",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 21,
                                                    "src": "2650:7:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_mapping$_t_address_$_t_mapping$_t_address_$_t_uint256_$_$",
                                                        "typeString": "mapping(address => mapping(address => uint256))"
                                                    }
                                                },
                                                "id": 195,
                                                "indexExpression": {
                                                    "argumentTypes": null,
                                                    "expression": {
                                                        "argumentTypes": null,
                                                        "id": 192,
                                                        "name": "msg",
                                                        "nodeType": "Identifier",
                                                        "overloadedDeclarations": [],
                                                        "referencedDeclaration": 457,
                                                        "src": "2658:3:0",
                                                        "typeDescriptions": {
                                                            "typeIdentifier": "t_magic_message",
                                                            "typeString": "msg"
                                                        }
                                                    },
                                                    "id": 193,
                                                    "isConstant": false,
                                                    "isLValue": false,
                                                    "isPure": false,
                                                    "lValueRequested": false,
                                                    "memberName": "sender",
                                                    "nodeType": "MemberAccess",
                                                    "referencedDeclaration": null,
                                                    "src": "2658:10:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_address_payable",
                                                        "typeString": "address payable"
                                                    }
                                                },
                                                "isConstant": false,
                                                "isLValue": true,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "nodeType": "IndexAccess",
                                                "src": "2650:19:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                                    "typeString": "mapping(address => uint256)"
                                                }
                                            },
                                            "id": 196,
                                            "indexExpression": {
                                                "argumentTypes": null,
                                                "id": 194,
                                                "name": "_spender",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 184,
                                                "src": "2670:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": true,
                                            "nodeType": "IndexAccess",
                                            "src": "2650:29:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "nodeType": "Assignment",
                                        "operator": "=",
                                        "rightHandSide": {
                                            "argumentTypes": null,
                                            "id": 197,
                                            "name": "_value",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 186,
                                            "src": "2682:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_uint256",
                                                "typeString": "uint256"
                                            }
                                        },
                                        "src": "2650:38:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "id": 199,
                                    "nodeType": "ExpressionStatement",
                                    "src": "2650:38:0"
                                },
                                {
                                    "eventCall": {
                                        "argumentTypes": null,
                                        "arguments": [{
                                                "argumentTypes": null,
                                                "expression": {
                                                    "argumentTypes": null,
                                                    "id": 201,
                                                    "name": "msg",
                                                    "nodeType": "Identifier",
                                                    "overloadedDeclarations": [],
                                                    "referencedDeclaration": 457,
                                                    "src": "2713:3:0",
                                                    "typeDescriptions": {
                                                        "typeIdentifier": "t_magic_message",
                                                        "typeString": "msg"
                                                    }
                                                },
                                                "id": 202,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "memberName": "sender",
                                                "nodeType": "MemberAccess",
                                                "referencedDeclaration": null,
                                                "src": "2713:10:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address_payable",
                                                    "typeString": "address payable"
                                                }
                                            },
                                            {
                                                "argumentTypes": null,
                                                "id": 203,
                                                "name": "_spender",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 184,
                                                "src": "2725:8:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                }
                                            },
                                            {
                                                "argumentTypes": null,
                                                "id": 204,
                                                "name": "_value",
                                                "nodeType": "Identifier",
                                                "overloadedDeclarations": [],
                                                "referencedDeclaration": 186,
                                                "src": "2735:6:0",
                                                "typeDescriptions": {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            }
                                        ],
                                        "expression": {
                                            "argumentTypes": [{
                                                    "typeIdentifier": "t_address_payable",
                                                    "typeString": "address payable"
                                                },
                                                {
                                                    "typeIdentifier": "t_address",
                                                    "typeString": "address"
                                                },
                                                {
                                                    "typeIdentifier": "t_uint256",
                                                    "typeString": "uint256"
                                                }
                                            ],
                                            "id": 200,
                                            "name": "Approval",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 292,
                                            "src": "2704:8:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_function_event_nonpayable$_t_address_$_t_address_$_t_uint256_$returns$__$",
                                                "typeString": "function (address,address,uint256)"
                                            }
                                        },
                                        "id": 205,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": false,
                                        "kind": "functionCall",
                                        "lValueRequested": false,
                                        "names": [],
                                        "nodeType": "FunctionCall",
                                        "src": "2704:38:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_tuple$__$",
                                            "typeString": "tuple()"
                                        }
                                    },
                                    "id": 206,
                                    "nodeType": "EmitStatement",
                                    "src": "2699:43:0"
                                },
                                {
                                    "expression": {
                                        "argumentTypes": null,
                                        "hexValue": "74727565",
                                        "id": 207,
                                        "isConstant": false,
                                        "isLValue": false,
                                        "isPure": true,
                                        "kind": "bool",
                                        "lValueRequested": false,
                                        "nodeType": "Literal",
                                        "src": "2806:4:0",
                                        "subdenomination": null,
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_bool",
                                            "typeString": "bool"
                                        },
                                        "value": "true"
                                    },
                                    "functionReturnParameters": 190,
                                    "id": 208,
                                    "nodeType": "Return",
                                    "src": "2799:11:0"
                                }
                            ]
                        },
                        "documentation": null,
                        "id": 210,
                        "implemented": true,
                        "kind": "function",
                        "modifiers": [],
                        "name": "approve",
                        "nodeType": "FunctionDefinition",
                        "parameters": {
                            "id": 187,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                    "constant": false,
                                    "id": 184,
                                    "name": "_spender",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 210,
                                    "src": "2575:16:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    },
                                    "typeName": {
                                        "id": 183,
                                        "name": "address",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "2575:7:0",
                                        "stateMutability": "nonpayable",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 186,
                                    "name": "_value",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 210,
                                    "src": "2593:14:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    },
                                    "typeName": {
                                        "id": 185,
                                        "name": "uint256",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "2593:7:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_uint256",
                                            "typeString": "uint256"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                }
                            ],
                            "src": "2574:34:0"
                        },
                        "returnParameters": {
                            "id": 190,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                "constant": false,
                                "id": 189,
                                "name": "success",
                                "nodeType": "VariableDeclaration",
                                "scope": 210,
                                "src": "2625:12:0",
                                "stateVariable": false,
                                "storageLocation": "default",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_bool",
                                    "typeString": "bool"
                                },
                                "typeName": {
                                    "id": 188,
                                    "name": "bool",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "2625:4:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_bool",
                                        "typeString": "bool"
                                    }
                                },
                                "value": null,
                                "visibility": "internal"
                            }],
                            "src": "2624:14:0"
                        },
                        "scope": 227,
                        "src": "2558:260:0",
                        "stateMutability": "nonpayable",
                        "superFunction": 267,
                        "visibility": "public"
                    },
                    {
                        "body": {
                            "id": 225,
                            "nodeType": "Block",
                            "src": "2919:51:0",
                            "statements": [{
                                "expression": {
                                    "argumentTypes": null,
                                    "baseExpression": {
                                        "argumentTypes": null,
                                        "baseExpression": {
                                            "argumentTypes": null,
                                            "id": 219,
                                            "name": "allowed",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 21,
                                            "src": "2937:7:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_mapping$_t_address_$_t_mapping$_t_address_$_t_uint256_$_$",
                                                "typeString": "mapping(address => mapping(address => uint256))"
                                            }
                                        },
                                        "id": 221,
                                        "indexExpression": {
                                            "argumentTypes": null,
                                            "id": 220,
                                            "name": "_owner",
                                            "nodeType": "Identifier",
                                            "overloadedDeclarations": [],
                                            "referencedDeclaration": 212,
                                            "src": "2945:6:0",
                                            "typeDescriptions": {
                                                "typeIdentifier": "t_address",
                                                "typeString": "address"
                                            }
                                        },
                                        "isConstant": false,
                                        "isLValue": true,
                                        "isPure": false,
                                        "lValueRequested": false,
                                        "nodeType": "IndexAccess",
                                        "src": "2937:15:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_mapping$_t_address_$_t_uint256_$",
                                            "typeString": "mapping(address => uint256)"
                                        }
                                    },
                                    "id": 223,
                                    "indexExpression": {
                                        "argumentTypes": null,
                                        "id": 222,
                                        "name": "_spender",
                                        "nodeType": "Identifier",
                                        "overloadedDeclarations": [],
                                        "referencedDeclaration": 214,
                                        "src": "2953:8:0",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "isConstant": false,
                                    "isLValue": true,
                                    "isPure": false,
                                    "lValueRequested": false,
                                    "nodeType": "IndexAccess",
                                    "src": "2937:25:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    }
                                },
                                "functionReturnParameters": 218,
                                "id": 224,
                                "nodeType": "Return",
                                "src": "2930:32:0"
                            }]
                        },
                        "documentation": null,
                        "id": 226,
                        "implemented": true,
                        "kind": "function",
                        "modifiers": [],
                        "name": "allowance",
                        "nodeType": "FunctionDefinition",
                        "parameters": {
                            "id": 215,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                    "constant": false,
                                    "id": 212,
                                    "name": "_owner",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 226,
                                    "src": "2845:14:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    },
                                    "typeName": {
                                        "id": 211,
                                        "name": "address",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "2845:7:0",
                                        "stateMutability": "nonpayable",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                },
                                {
                                    "constant": false,
                                    "id": 214,
                                    "name": "_spender",
                                    "nodeType": "VariableDeclaration",
                                    "scope": 226,
                                    "src": "2861:16:0",
                                    "stateVariable": false,
                                    "storageLocation": "default",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_address",
                                        "typeString": "address"
                                    },
                                    "typeName": {
                                        "id": 213,
                                        "name": "address",
                                        "nodeType": "ElementaryTypeName",
                                        "src": "2861:7:0",
                                        "stateMutability": "nonpayable",
                                        "typeDescriptions": {
                                            "typeIdentifier": "t_address",
                                            "typeString": "address"
                                        }
                                    },
                                    "value": null,
                                    "visibility": "internal"
                                }
                            ],
                            "src": "2844:34:0"
                        },
                        "returnParameters": {
                            "id": 218,
                            "nodeType": "ParameterList",
                            "parameters": [{
                                "constant": false,
                                "id": 217,
                                "name": "remaining",
                                "nodeType": "VariableDeclaration",
                                "scope": 226,
                                "src": "2900:17:0",
                                "stateVariable": false,
                                "storageLocation": "default",
                                "typeDescriptions": {
                                    "typeIdentifier": "t_uint256",
                                    "typeString": "uint256"
                                },
                                "typeName": {
                                    "id": 216,
                                    "name": "uint256",
                                    "nodeType": "ElementaryTypeName",
                                    "src": "2900:7:0",
                                    "typeDescriptions": {
                                        "typeIdentifier": "t_uint256",
                                        "typeString": "uint256"
                                    }
                                },
                                "value": null,
                                "visibility": "internal"
                            }],
                            "src": "2899:19:0"
                        },
                        "scope": 227,
                        "src": "2826:144:0",
                        "stateMutability": "view",
                        "superFunction": 276,
                        "visibility": "public"
                    }
                ],
                "scope": 228,
                "src": "179:2794:0"
            }
        ],
        "src": "107:2866:0"
    },
    "legacyAST": {
        "attributes": {
            "absolutePath": "/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/BestToking.sol",
            "exportedSymbols": {
                "BestToking": [
                    227
                ]
            }
        },
        "children": [{
                "attributes": {
                    "literals": [
                        "solidity",
                        ">=",
                        "0.4",
                        ".22",
                        "<",
                        "0.8",
                        ".0"
                    ]
                },
                "id": 1,
                "name": "PragmaDirective",
                "src": "107:32:0"
            },
            {
                "attributes": {
                    "SourceUnit": 294,
                    "absolutePath": "/C/Users/chris/Desktop/Dapp/dapp2/election/contracts/EIP20Interface.sol",
                    "file": "./EIP20Interface.sol",
                    "scope": 228,
                    "symbolAliases": [
                        null
                    ],
                    "unitAlias": ""
                },
                "id": 2,
                "name": "ImportDirective",
                "src": "143:30:0"
            },
            {
                "attributes": {
                    "contractDependencies": [
                        293
                    ],
                    "contractKind": "contract",
                    "documentation": null,
                    "fullyImplemented": true,
                    "linearizedBaseContracts": [
                        227,
                        293
                    ],
                    "name": "BestToking",
                    "scope": 228
                },
                "children": [{
                        "attributes": {
                            "arguments": null
                        },
                        "children": [{
                            "attributes": {
                                "contractScope": null,
                                "name": "EIP20Interface",
                                "referencedDeclaration": 293,
                                "type": "contract EIP20Interface"
                            },
                            "id": 3,
                            "name": "UserDefinedTypeName",
                            "src": "202:14:0"
                        }],
                        "id": 4,
                        "name": "InheritanceSpecifier",
                        "src": "202:14:0"
                    },
                    {
                        "attributes": {
                            "constant": true,
                            "name": "MAX_UINT256",
                            "scope": 227,
                            "stateVariable": true,
                            "storageLocation": "default",
                            "type": "uint256",
                            "visibility": "private"
                        },
                        "children": [{
                                "attributes": {
                                    "name": "uint256",
                                    "type": "uint256"
                                },
                                "id": 5,
                                "name": "ElementaryTypeName",
                                "src": "226:7:0"
                            },
                            {
                                "attributes": {
                                    "argumentTypes": null,
                                    "commonType": {
                                        "typeIdentifier": "t_rational_115792089237316195423570985008687907853269984665640564039457584007913129639935_by_1",
                                        "typeString": "int_const 1157...(70 digits omitted)...9935"
                                    },
                                    "isConstant": false,
                                    "isLValue": false,
                                    "isPure": true,
                                    "lValueRequested": false,
                                    "operator": "-",
                                    "type": "int_const 1157...(70 digits omitted)...9935"
                                },
                                "children": [{
                                        "attributes": {
                                            "argumentTypes": null,
                                            "commonType": {
                                                "typeIdentifier": "t_rational_115792089237316195423570985008687907853269984665640564039457584007913129639936_by_1",
                                                "typeString": "int_const 1157...(70 digits omitted)...9936"
                                            },
                                            "isConstant": false,
                                            "isLValue": false,
                                            "isPure": true,
                                            "lValueRequested": false,
                                            "operator": "**",
                                            "type": "int_const 1157...(70 digits omitted)...9936"
                                        },
                                        "children": [{
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "hexvalue": "32",
                                                    "isConstant": false,
                                                    "isLValue": false,
                                                    "isPure": true,
                                                    "lValueRequested": false,
                                                    "subdenomination": null,
                                                    "token": "number",
                                                    "type": "int_const 2",
                                                    "value": "2"
                                                },
                                                "id": 6,
                                                "name": "Literal",
                                                "src": "265:1:0"
                                            },
                                            {
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "hexvalue": "323536",
                                                    "isConstant": false,
                                                    "isLValue": false,
                                                    "isPure": true,
                                                    "lValueRequested": false,
                                                    "subdenomination": null,
                                                    "token": "number",
                                                    "type": "int_const 256",
                                                    "value": "256"
                                                },
                                                "id": 7,
                                                "name": "Literal",
                                                "src": "268:3:0"
                                            }
                                        ],
                                        "id": 8,
                                        "name": "BinaryOperation",
                                        "src": "265:6:0"
                                    },
                                    {
                                        "attributes": {
                                            "argumentTypes": null,
                                            "hexvalue": "31",
                                            "isConstant": false,
                                            "isLValue": false,
                                            "isPure": true,
                                            "lValueRequested": false,
                                            "subdenomination": null,
                                            "token": "number",
                                            "type": "int_const 1",
                                            "value": "1"
                                        },
                                        "id": 9,
                                        "name": "Literal",
                                        "src": "274:1:0"
                                    }
                                ],
                                "id": 10,
                                "name": "BinaryOperation",
                                "src": "265:10:0"
                            }
                        ],
                        "id": 11,
                        "name": "VariableDeclaration",
                        "src": "226:49:0"
                    },
                    {
                        "attributes": {
                            "constant": false,
                            "name": "balances",
                            "scope": 227,
                            "stateVariable": true,
                            "storageLocation": "default",
                            "type": "mapping(address => uint256)",
                            "value": null,
                            "visibility": "public"
                        },
                        "children": [{
                            "attributes": {
                                "type": "mapping(address => uint256)"
                            },
                            "children": [{
                                    "attributes": {
                                        "name": "address",
                                        "type": "address"
                                    },
                                    "id": 12,
                                    "name": "ElementaryTypeName",
                                    "src": "291:7:0"
                                },
                                {
                                    "attributes": {
                                        "name": "uint256",
                                        "type": "uint256"
                                    },
                                    "id": 13,
                                    "name": "ElementaryTypeName",
                                    "src": "302:7:0"
                                }
                            ],
                            "id": 14,
                            "name": "Mapping",
                            "src": "282:28:0"
                        }],
                        "id": 15,
                        "name": "VariableDeclaration",
                        "src": "282:44:0"
                    },
                    {
                        "attributes": {
                            "constant": false,
                            "name": "allowed",
                            "scope": 227,
                            "stateVariable": true,
                            "storageLocation": "default",
                            "type": "mapping(address => mapping(address => uint256))",
                            "value": null,
                            "visibility": "public"
                        },
                        "children": [{
                            "attributes": {
                                "type": "mapping(address => mapping(address => uint256))"
                            },
                            "children": [{
                                    "attributes": {
                                        "name": "address",
                                        "type": "address"
                                    },
                                    "id": 16,
                                    "name": "ElementaryTypeName",
                                    "src": "342:7:0"
                                },
                                {
                                    "attributes": {
                                        "type": "mapping(address => uint256)"
                                    },
                                    "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "type": "address"
                                            },
                                            "id": 17,
                                            "name": "ElementaryTypeName",
                                            "src": "362:7:0"
                                        },
                                        {
                                            "attributes": {
                                                "name": "uint256",
                                                "type": "uint256"
                                            },
                                            "id": 18,
                                            "name": "ElementaryTypeName",
                                            "src": "373:7:0"
                                        }
                                    ],
                                    "id": 19,
                                    "name": "Mapping",
                                    "src": "353:28:0"
                                }
                            ],
                            "id": 20,
                            "name": "Mapping",
                            "src": "333:49:0"
                        }],
                        "id": 21,
                        "name": "VariableDeclaration",
                        "src": "333:64:0"
                    },
                    {
                        "attributes": {
                            "constant": false,
                            "name": "name",
                            "scope": 227,
                            "stateVariable": true,
                            "storageLocation": "default",
                            "type": "string",
                            "value": null,
                            "visibility": "public"
                        },
                        "children": [{
                            "attributes": {
                                "name": "string",
                                "type": "string"
                            },
                            "id": 22,
                            "name": "ElementaryTypeName",
                            "src": "697:6:0"
                        }],
                        "id": 23,
                        "name": "VariableDeclaration",
                        "src": "697:18:0"
                    },
                    {
                        "attributes": {
                            "constant": false,
                            "name": "decimals",
                            "scope": 227,
                            "stateVariable": true,
                            "storageLocation": "default",
                            "type": "uint8",
                            "value": null,
                            "visibility": "public"
                        },
                        "children": [{
                            "attributes": {
                                "name": "uint8",
                                "type": "uint8"
                            },
                            "id": 24,
                            "name": "ElementaryTypeName",
                            "src": "769:5:0"
                        }],
                        "id": 25,
                        "name": "VariableDeclaration",
                        "src": "769:21:0"
                    },
                    {
                        "attributes": {
                            "constant": false,
                            "name": "symbol",
                            "scope": 227,
                            "stateVariable": true,
                            "storageLocation": "default",
                            "type": "string",
                            "value": null,
                            "visibility": "public"
                        },
                        "children": [{
                            "attributes": {
                                "name": "string",
                                "type": "string"
                            },
                            "id": 26,
                            "name": "ElementaryTypeName",
                            "src": "841:6:0"
                        }],
                        "id": 27,
                        "name": "VariableDeclaration",
                        "src": "841:20:0"
                    },
                    {
                        "attributes": {
                            "documentation": null,
                            "implemented": true,
                            "isConstructor": true,
                            "kind": "constructor",
                            "modifiers": [
                                null
                            ],
                            "name": "",
                            "scope": 227,
                            "stateMutability": "nonpayable",
                            "superFunction": null,
                            "visibility": "public"
                        },
                        "children": [{
                                "children": [{
                                        "attributes": {
                                            "constant": false,
                                            "name": "_initialAmount",
                                            "scope": 62,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "uint256",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "uint256",
                                                "type": "uint256"
                                            },
                                            "id": 28,
                                            "name": "ElementaryTypeName",
                                            "src": "933:7:0"
                                        }],
                                        "id": 29,
                                        "name": "VariableDeclaration",
                                        "src": "933:22:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_tokenName",
                                            "scope": 62,
                                            "stateVariable": false,
                                            "storageLocation": "memory",
                                            "type": "string",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "string",
                                                "type": "string"
                                            },
                                            "id": 30,
                                            "name": "ElementaryTypeName",
                                            "src": "966:6:0"
                                        }],
                                        "id": 31,
                                        "name": "VariableDeclaration",
                                        "src": "966:24:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_decimalUnits",
                                            "scope": 62,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "uint8",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "uint8",
                                                "type": "uint8"
                                            },
                                            "id": 32,
                                            "name": "ElementaryTypeName",
                                            "src": "1001:5:0"
                                        }],
                                        "id": 33,
                                        "name": "VariableDeclaration",
                                        "src": "1001:19:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_tokenSymbol",
                                            "scope": 62,
                                            "stateVariable": false,
                                            "storageLocation": "memory",
                                            "type": "string",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "string",
                                                "type": "string"
                                            },
                                            "id": 34,
                                            "name": "ElementaryTypeName",
                                            "src": "1031:6:0"
                                        }],
                                        "id": 35,
                                        "name": "VariableDeclaration",
                                        "src": "1031:26:0"
                                    }
                                ],
                                "id": 36,
                                "name": "ParameterList",
                                "src": "922:142:0"
                            },
                            {
                                "attributes": {
                                    "parameters": [
                                        null
                                    ]
                                },
                                "children": [],
                                "id": 37,
                                "name": "ParameterList",
                                "src": "1072:0:0"
                            },
                            {
                                "children": [{
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": true,
                                                        "type": "uint256"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 15,
                                                                "type": "mapping(address => uint256)",
                                                                "value": "balances"
                                                            },
                                                            "id": 38,
                                                            "name": "Identifier",
                                                            "src": "1083:8:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "isConstant": false,
                                                                "isLValue": false,
                                                                "isPure": false,
                                                                "lValueRequested": false,
                                                                "member_name": "sender",
                                                                "referencedDeclaration": null,
                                                                "type": "address payable"
                                                            },
                                                            "children": [{
                                                                "attributes": {
                                                                    "argumentTypes": null,
                                                                    "overloadedDeclarations": [
                                                                        null
                                                                    ],
                                                                    "referencedDeclaration": 457,
                                                                    "type": "msg",
                                                                    "value": "msg"
                                                                },
                                                                "id": 39,
                                                                "name": "Identifier",
                                                                "src": "1092:3:0"
                                                            }],
                                                            "id": 40,
                                                            "name": "MemberAccess",
                                                            "src": "1092:10:0"
                                                        }
                                                    ],
                                                    "id": 41,
                                                    "name": "IndexAccess",
                                                    "src": "1083:20:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 29,
                                                        "type": "uint256",
                                                        "value": "_initialAmount"
                                                    },
                                                    "id": 42,
                                                    "name": "Identifier",
                                                    "src": "1106:14:0"
                                                }
                                            ],
                                            "id": 43,
                                            "name": "Assignment",
                                            "src": "1083:37:0"
                                        }],
                                        "id": 44,
                                        "name": "ExpressionStatement",
                                        "src": "1083:37:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 231,
                                                        "type": "uint256",
                                                        "value": "totalSupply"
                                                    },
                                                    "id": 45,
                                                    "name": "Identifier",
                                                    "src": "1184:11:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 29,
                                                        "type": "uint256",
                                                        "value": "_initialAmount"
                                                    },
                                                    "id": 46,
                                                    "name": "Identifier",
                                                    "src": "1198:14:0"
                                                }
                                            ],
                                            "id": 47,
                                            "name": "Assignment",
                                            "src": "1184:28:0"
                                        }],
                                        "id": 48,
                                        "name": "ExpressionStatement",
                                        "src": "1184:28:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "=",
                                                "type": "string storage ref"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 23,
                                                        "type": "string storage ref",
                                                        "value": "name"
                                                    },
                                                    "id": 49,
                                                    "name": "Identifier",
                                                    "src": "1269:4:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 31,
                                                        "type": "string memory",
                                                        "value": "_tokenName"
                                                    },
                                                    "id": 50,
                                                    "name": "Identifier",
                                                    "src": "1276:10:0"
                                                }
                                            ],
                                            "id": 51,
                                            "name": "Assignment",
                                            "src": "1269:17:0"
                                        }],
                                        "id": 52,
                                        "name": "ExpressionStatement",
                                        "src": "1269:17:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "=",
                                                "type": "uint8"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 25,
                                                        "type": "uint8",
                                                        "value": "decimals"
                                                    },
                                                    "id": 53,
                                                    "name": "Identifier",
                                                    "src": "1368:8:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 33,
                                                        "type": "uint8",
                                                        "value": "_decimalUnits"
                                                    },
                                                    "id": 54,
                                                    "name": "Identifier",
                                                    "src": "1379:13:0"
                                                }
                                            ],
                                            "id": 55,
                                            "name": "Assignment",
                                            "src": "1368:24:0"
                                        }],
                                        "id": 56,
                                        "name": "ExpressionStatement",
                                        "src": "1368:24:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "=",
                                                "type": "string storage ref"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 27,
                                                        "type": "string storage ref",
                                                        "value": "symbol"
                                                    },
                                                    "id": 57,
                                                    "name": "Identifier",
                                                    "src": "1473:6:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 35,
                                                        "type": "string memory",
                                                        "value": "_tokenSymbol"
                                                    },
                                                    "id": 58,
                                                    "name": "Identifier",
                                                    "src": "1482:12:0"
                                                }
                                            ],
                                            "id": 59,
                                            "name": "Assignment",
                                            "src": "1473:21:0"
                                        }],
                                        "id": 60,
                                        "name": "ExpressionStatement",
                                        "src": "1473:21:0"
                                    }
                                ],
                                "id": 61,
                                "name": "Block",
                                "src": "1072:499:0"
                            }
                        ],
                        "id": 62,
                        "name": "FunctionDefinition",
                        "src": "910:661:0"
                    },
                    {
                        "attributes": {
                            "documentation": null,
                            "implemented": true,
                            "isConstructor": false,
                            "kind": "function",
                            "modifiers": [
                                null
                            ],
                            "name": "transfer",
                            "scope": 227,
                            "stateMutability": "nonpayable",
                            "superFunction": 247,
                            "visibility": "public"
                        },
                        "children": [{
                                "children": [{
                                        "attributes": {
                                            "constant": false,
                                            "name": "_to",
                                            "scope": 103,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "address",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "stateMutability": "nonpayable",
                                                "type": "address"
                                            },
                                            "id": 63,
                                            "name": "ElementaryTypeName",
                                            "src": "1597:7:0"
                                        }],
                                        "id": 64,
                                        "name": "VariableDeclaration",
                                        "src": "1597:11:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_value",
                                            "scope": 103,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "uint256",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "uint256",
                                                "type": "uint256"
                                            },
                                            "id": 65,
                                            "name": "ElementaryTypeName",
                                            "src": "1610:7:0"
                                        }],
                                        "id": 66,
                                        "name": "VariableDeclaration",
                                        "src": "1610:14:0"
                                    }
                                ],
                                "id": 67,
                                "name": "ParameterList",
                                "src": "1596:29:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "constant": false,
                                        "name": "success",
                                        "scope": 103,
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "type": "bool",
                                        "value": null,
                                        "visibility": "internal"
                                    },
                                    "children": [{
                                        "attributes": {
                                            "name": "bool",
                                            "type": "bool"
                                        },
                                        "id": 68,
                                        "name": "ElementaryTypeName",
                                        "src": "1642:4:0"
                                    }],
                                    "id": 69,
                                    "name": "VariableDeclaration",
                                    "src": "1642:12:0"
                                }],
                                "id": 70,
                                "name": "ParameterList",
                                "src": "1641:14:0"
                            },
                            {
                                "children": [{
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "isStructConstructorCall": false,
                                                "lValueRequested": false,
                                                "names": [
                                                    null
                                                ],
                                                "type": "tuple()",
                                                "type_conversion": false
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": [{
                                                            "typeIdentifier": "t_bool",
                                                            "typeString": "bool"
                                                        }],
                                                        "overloadedDeclarations": [
                                                            460,
                                                            461
                                                        ],
                                                        "referencedDeclaration": 460,
                                                        "type": "function (bool) pure",
                                                        "value": "require"
                                                    },
                                                    "id": 71,
                                                    "name": "Identifier",
                                                    "src": "1667:7:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "commonType": {
                                                            "typeIdentifier": "t_uint256",
                                                            "typeString": "uint256"
                                                        },
                                                        "isConstant": false,
                                                        "isLValue": false,
                                                        "isPure": false,
                                                        "lValueRequested": false,
                                                        "operator": ">=",
                                                        "type": "bool"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "isConstant": false,
                                                                "isLValue": true,
                                                                "isPure": false,
                                                                "lValueRequested": false,
                                                                "type": "uint256"
                                                            },
                                                            "children": [{
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "overloadedDeclarations": [
                                                                            null
                                                                        ],
                                                                        "referencedDeclaration": 15,
                                                                        "type": "mapping(address => uint256)",
                                                                        "value": "balances"
                                                                    },
                                                                    "id": 72,
                                                                    "name": "Identifier",
                                                                    "src": "1675:8:0"
                                                                },
                                                                {
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "isConstant": false,
                                                                        "isLValue": false,
                                                                        "isPure": false,
                                                                        "lValueRequested": false,
                                                                        "member_name": "sender",
                                                                        "referencedDeclaration": null,
                                                                        "type": "address payable"
                                                                    },
                                                                    "children": [{
                                                                        "attributes": {
                                                                            "argumentTypes": null,
                                                                            "overloadedDeclarations": [
                                                                                null
                                                                            ],
                                                                            "referencedDeclaration": 457,
                                                                            "type": "msg",
                                                                            "value": "msg"
                                                                        },
                                                                        "id": 73,
                                                                        "name": "Identifier",
                                                                        "src": "1684:3:0"
                                                                    }],
                                                                    "id": 74,
                                                                    "name": "MemberAccess",
                                                                    "src": "1684:10:0"
                                                                }
                                                            ],
                                                            "id": 75,
                                                            "name": "IndexAccess",
                                                            "src": "1675:20:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 66,
                                                                "type": "uint256",
                                                                "value": "_value"
                                                            },
                                                            "id": 76,
                                                            "name": "Identifier",
                                                            "src": "1699:6:0"
                                                        }
                                                    ],
                                                    "id": 77,
                                                    "name": "BinaryOperation",
                                                    "src": "1675:30:0"
                                                }
                                            ],
                                            "id": 78,
                                            "name": "FunctionCall",
                                            "src": "1667:39:0"
                                        }],
                                        "id": 79,
                                        "name": "ExpressionStatement",
                                        "src": "1667:39:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "-=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": true,
                                                        "type": "uint256"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 15,
                                                                "type": "mapping(address => uint256)",
                                                                "value": "balances"
                                                            },
                                                            "id": 80,
                                                            "name": "Identifier",
                                                            "src": "1717:8:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "isConstant": false,
                                                                "isLValue": false,
                                                                "isPure": false,
                                                                "lValueRequested": false,
                                                                "member_name": "sender",
                                                                "referencedDeclaration": null,
                                                                "type": "address payable"
                                                            },
                                                            "children": [{
                                                                "attributes": {
                                                                    "argumentTypes": null,
                                                                    "overloadedDeclarations": [
                                                                        null
                                                                    ],
                                                                    "referencedDeclaration": 457,
                                                                    "type": "msg",
                                                                    "value": "msg"
                                                                },
                                                                "id": 81,
                                                                "name": "Identifier",
                                                                "src": "1726:3:0"
                                                            }],
                                                            "id": 82,
                                                            "name": "MemberAccess",
                                                            "src": "1726:10:0"
                                                        }
                                                    ],
                                                    "id": 83,
                                                    "name": "IndexAccess",
                                                    "src": "1717:20:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 66,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 84,
                                                    "name": "Identifier",
                                                    "src": "1741:6:0"
                                                }
                                            ],
                                            "id": 85,
                                            "name": "Assignment",
                                            "src": "1717:30:0"
                                        }],
                                        "id": 86,
                                        "name": "ExpressionStatement",
                                        "src": "1717:30:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "+=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": true,
                                                        "type": "uint256"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 15,
                                                                "type": "mapping(address => uint256)",
                                                                "value": "balances"
                                                            },
                                                            "id": 87,
                                                            "name": "Identifier",
                                                            "src": "1758:8:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 64,
                                                                "type": "address",
                                                                "value": "_to"
                                                            },
                                                            "id": 88,
                                                            "name": "Identifier",
                                                            "src": "1767:3:0"
                                                        }
                                                    ],
                                                    "id": 89,
                                                    "name": "IndexAccess",
                                                    "src": "1758:13:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 66,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 90,
                                                    "name": "Identifier",
                                                    "src": "1775:6:0"
                                                }
                                            ],
                                            "id": 91,
                                            "name": "Assignment",
                                            "src": "1758:23:0"
                                        }],
                                        "id": 92,
                                        "name": "ExpressionStatement",
                                        "src": "1758:23:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "isStructConstructorCall": false,
                                                "lValueRequested": false,
                                                "names": [
                                                    null
                                                ],
                                                "type": "tuple()",
                                                "type_conversion": false
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": [{
                                                                "typeIdentifier": "t_address_payable",
                                                                "typeString": "address payable"
                                                            },
                                                            {
                                                                "typeIdentifier": "t_address",
                                                                "typeString": "address"
                                                            },
                                                            {
                                                                "typeIdentifier": "t_uint256",
                                                                "typeString": "uint256"
                                                            }
                                                        ],
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 284,
                                                        "type": "function (address,address,uint256)",
                                                        "value": "Transfer"
                                                    },
                                                    "id": 93,
                                                    "name": "Identifier",
                                                    "src": "1797:8:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": false,
                                                        "isPure": false,
                                                        "lValueRequested": false,
                                                        "member_name": "sender",
                                                        "referencedDeclaration": null,
                                                        "type": "address payable"
                                                    },
                                                    "children": [{
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "overloadedDeclarations": [
                                                                null
                                                            ],
                                                            "referencedDeclaration": 457,
                                                            "type": "msg",
                                                            "value": "msg"
                                                        },
                                                        "id": 94,
                                                        "name": "Identifier",
                                                        "src": "1806:3:0"
                                                    }],
                                                    "id": 95,
                                                    "name": "MemberAccess",
                                                    "src": "1806:10:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 64,
                                                        "type": "address",
                                                        "value": "_to"
                                                    },
                                                    "id": 96,
                                                    "name": "Identifier",
                                                    "src": "1818:3:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 66,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 97,
                                                    "name": "Identifier",
                                                    "src": "1823:6:0"
                                                }
                                            ],
                                            "id": 98,
                                            "name": "FunctionCall",
                                            "src": "1797:33:0"
                                        }],
                                        "id": 99,
                                        "name": "EmitStatement",
                                        "src": "1792:38:0"
                                    },
                                    {
                                        "attributes": {
                                            "functionReturnParameters": 70
                                        },
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "hexvalue": "74727565",
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": true,
                                                "lValueRequested": false,
                                                "subdenomination": null,
                                                "token": "bool",
                                                "type": "bool",
                                                "value": "true"
                                            },
                                            "id": 100,
                                            "name": "Literal",
                                            "src": "1894:4:0"
                                        }],
                                        "id": 101,
                                        "name": "Return",
                                        "src": "1887:11:0"
                                    }
                                ],
                                "id": 102,
                                "name": "Block",
                                "src": "1656:250:0"
                            }
                        ],
                        "id": 103,
                        "name": "FunctionDefinition",
                        "src": "1579:327:0"
                    },
                    {
                        "attributes": {
                            "documentation": null,
                            "implemented": true,
                            "isConstructor": false,
                            "kind": "function",
                            "modifiers": [
                                null
                            ],
                            "name": "transferFrom",
                            "scope": 227,
                            "stateMutability": "nonpayable",
                            "superFunction": 258,
                            "visibility": "public"
                        },
                        "children": [{
                                "children": [{
                                        "attributes": {
                                            "constant": false,
                                            "name": "_from",
                                            "scope": 170,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "address",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "stateMutability": "nonpayable",
                                                "type": "address"
                                            },
                                            "id": 104,
                                            "name": "ElementaryTypeName",
                                            "src": "1936:7:0"
                                        }],
                                        "id": 105,
                                        "name": "VariableDeclaration",
                                        "src": "1936:13:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_to",
                                            "scope": 170,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "address",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "stateMutability": "nonpayable",
                                                "type": "address"
                                            },
                                            "id": 106,
                                            "name": "ElementaryTypeName",
                                            "src": "1951:7:0"
                                        }],
                                        "id": 107,
                                        "name": "VariableDeclaration",
                                        "src": "1951:11:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_value",
                                            "scope": 170,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "uint256",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "uint256",
                                                "type": "uint256"
                                            },
                                            "id": 108,
                                            "name": "ElementaryTypeName",
                                            "src": "1964:7:0"
                                        }],
                                        "id": 109,
                                        "name": "VariableDeclaration",
                                        "src": "1964:14:0"
                                    }
                                ],
                                "id": 110,
                                "name": "ParameterList",
                                "src": "1935:44:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "constant": false,
                                        "name": "success",
                                        "scope": 170,
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "type": "bool",
                                        "value": null,
                                        "visibility": "internal"
                                    },
                                    "children": [{
                                        "attributes": {
                                            "name": "bool",
                                            "type": "bool"
                                        },
                                        "id": 111,
                                        "name": "ElementaryTypeName",
                                        "src": "1996:4:0"
                                    }],
                                    "id": 112,
                                    "name": "VariableDeclaration",
                                    "src": "1996:12:0"
                                }],
                                "id": 113,
                                "name": "ParameterList",
                                "src": "1995:14:0"
                            },
                            {
                                "children": [{
                                        "attributes": {
                                            "assignments": [
                                                115
                                            ]
                                        },
                                        "children": [{
                                                "attributes": {
                                                    "constant": false,
                                                    "name": "allowance",
                                                    "scope": 169,
                                                    "stateVariable": false,
                                                    "storageLocation": "default",
                                                    "type": "uint256",
                                                    "value": null,
                                                    "visibility": "internal"
                                                },
                                                "children": [{
                                                    "attributes": {
                                                        "name": "uint256",
                                                        "type": "uint256"
                                                    },
                                                    "id": 114,
                                                    "name": "ElementaryTypeName",
                                                    "src": "2021:7:0"
                                                }],
                                                "id": 115,
                                                "name": "VariableDeclaration",
                                                "src": "2021:17:0"
                                            },
                                            {
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "isConstant": false,
                                                    "isLValue": true,
                                                    "isPure": false,
                                                    "lValueRequested": false,
                                                    "type": "uint256"
                                                },
                                                "children": [{
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "isConstant": false,
                                                            "isLValue": true,
                                                            "isPure": false,
                                                            "lValueRequested": false,
                                                            "type": "mapping(address => uint256)"
                                                        },
                                                        "children": [{
                                                                "attributes": {
                                                                    "argumentTypes": null,
                                                                    "overloadedDeclarations": [
                                                                        null
                                                                    ],
                                                                    "referencedDeclaration": 21,
                                                                    "type": "mapping(address => mapping(address => uint256))",
                                                                    "value": "allowed"
                                                                },
                                                                "id": 116,
                                                                "name": "Identifier",
                                                                "src": "2041:7:0"
                                                            },
                                                            {
                                                                "attributes": {
                                                                    "argumentTypes": null,
                                                                    "overloadedDeclarations": [
                                                                        null
                                                                    ],
                                                                    "referencedDeclaration": 105,
                                                                    "type": "address",
                                                                    "value": "_from"
                                                                },
                                                                "id": 117,
                                                                "name": "Identifier",
                                                                "src": "2049:5:0"
                                                            }
                                                        ],
                                                        "id": 118,
                                                        "name": "IndexAccess",
                                                        "src": "2041:14:0"
                                                    },
                                                    {
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "isConstant": false,
                                                            "isLValue": false,
                                                            "isPure": false,
                                                            "lValueRequested": false,
                                                            "member_name": "sender",
                                                            "referencedDeclaration": null,
                                                            "type": "address payable"
                                                        },
                                                        "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 457,
                                                                "type": "msg",
                                                                "value": "msg"
                                                            },
                                                            "id": 119,
                                                            "name": "Identifier",
                                                            "src": "2056:3:0"
                                                        }],
                                                        "id": 120,
                                                        "name": "MemberAccess",
                                                        "src": "2056:10:0"
                                                    }
                                                ],
                                                "id": 121,
                                                "name": "IndexAccess",
                                                "src": "2041:26:0"
                                            }
                                        ],
                                        "id": 122,
                                        "name": "VariableDeclarationStatement",
                                        "src": "2021:46:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "isStructConstructorCall": false,
                                                "lValueRequested": false,
                                                "names": [
                                                    null
                                                ],
                                                "type": "tuple()",
                                                "type_conversion": false
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": [{
                                                            "typeIdentifier": "t_bool",
                                                            "typeString": "bool"
                                                        }],
                                                        "overloadedDeclarations": [
                                                            460,
                                                            461
                                                        ],
                                                        "referencedDeclaration": 460,
                                                        "type": "function (bool) pure",
                                                        "value": "require"
                                                    },
                                                    "id": 123,
                                                    "name": "Identifier",
                                                    "src": "2078:7:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "commonType": {
                                                            "typeIdentifier": "t_bool",
                                                            "typeString": "bool"
                                                        },
                                                        "isConstant": false,
                                                        "isLValue": false,
                                                        "isPure": false,
                                                        "lValueRequested": false,
                                                        "operator": "&&",
                                                        "type": "bool"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "commonType": {
                                                                    "typeIdentifier": "t_uint256",
                                                                    "typeString": "uint256"
                                                                },
                                                                "isConstant": false,
                                                                "isLValue": false,
                                                                "isPure": false,
                                                                "lValueRequested": false,
                                                                "operator": ">=",
                                                                "type": "bool"
                                                            },
                                                            "children": [{
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "isConstant": false,
                                                                        "isLValue": true,
                                                                        "isPure": false,
                                                                        "lValueRequested": false,
                                                                        "type": "uint256"
                                                                    },
                                                                    "children": [{
                                                                            "attributes": {
                                                                                "argumentTypes": null,
                                                                                "overloadedDeclarations": [
                                                                                    null
                                                                                ],
                                                                                "referencedDeclaration": 15,
                                                                                "type": "mapping(address => uint256)",
                                                                                "value": "balances"
                                                                            },
                                                                            "id": 124,
                                                                            "name": "Identifier",
                                                                            "src": "2086:8:0"
                                                                        },
                                                                        {
                                                                            "attributes": {
                                                                                "argumentTypes": null,
                                                                                "overloadedDeclarations": [
                                                                                    null
                                                                                ],
                                                                                "referencedDeclaration": 105,
                                                                                "type": "address",
                                                                                "value": "_from"
                                                                            },
                                                                            "id": 125,
                                                                            "name": "Identifier",
                                                                            "src": "2095:5:0"
                                                                        }
                                                                    ],
                                                                    "id": 126,
                                                                    "name": "IndexAccess",
                                                                    "src": "2086:15:0"
                                                                },
                                                                {
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "overloadedDeclarations": [
                                                                            null
                                                                        ],
                                                                        "referencedDeclaration": 109,
                                                                        "type": "uint256",
                                                                        "value": "_value"
                                                                    },
                                                                    "id": 127,
                                                                    "name": "Identifier",
                                                                    "src": "2105:6:0"
                                                                }
                                                            ],
                                                            "id": 128,
                                                            "name": "BinaryOperation",
                                                            "src": "2086:25:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "commonType": {
                                                                    "typeIdentifier": "t_uint256",
                                                                    "typeString": "uint256"
                                                                },
                                                                "isConstant": false,
                                                                "isLValue": false,
                                                                "isPure": false,
                                                                "lValueRequested": false,
                                                                "operator": ">=",
                                                                "type": "bool"
                                                            },
                                                            "children": [{
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "overloadedDeclarations": [
                                                                            null
                                                                        ],
                                                                        "referencedDeclaration": 115,
                                                                        "type": "uint256",
                                                                        "value": "allowance"
                                                                    },
                                                                    "id": 129,
                                                                    "name": "Identifier",
                                                                    "src": "2115:9:0"
                                                                },
                                                                {
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "overloadedDeclarations": [
                                                                            null
                                                                        ],
                                                                        "referencedDeclaration": 109,
                                                                        "type": "uint256",
                                                                        "value": "_value"
                                                                    },
                                                                    "id": 130,
                                                                    "name": "Identifier",
                                                                    "src": "2128:6:0"
                                                                }
                                                            ],
                                                            "id": 131,
                                                            "name": "BinaryOperation",
                                                            "src": "2115:19:0"
                                                        }
                                                    ],
                                                    "id": 132,
                                                    "name": "BinaryOperation",
                                                    "src": "2086:48:0"
                                                }
                                            ],
                                            "id": 133,
                                            "name": "FunctionCall",
                                            "src": "2078:57:0"
                                        }],
                                        "id": 134,
                                        "name": "ExpressionStatement",
                                        "src": "2078:57:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "+=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": true,
                                                        "type": "uint256"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 15,
                                                                "type": "mapping(address => uint256)",
                                                                "value": "balances"
                                                            },
                                                            "id": 135,
                                                            "name": "Identifier",
                                                            "src": "2146:8:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 107,
                                                                "type": "address",
                                                                "value": "_to"
                                                            },
                                                            "id": 136,
                                                            "name": "Identifier",
                                                            "src": "2155:3:0"
                                                        }
                                                    ],
                                                    "id": 137,
                                                    "name": "IndexAccess",
                                                    "src": "2146:13:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 109,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 138,
                                                    "name": "Identifier",
                                                    "src": "2163:6:0"
                                                }
                                            ],
                                            "id": 139,
                                            "name": "Assignment",
                                            "src": "2146:23:0"
                                        }],
                                        "id": 140,
                                        "name": "ExpressionStatement",
                                        "src": "2146:23:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "-=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": true,
                                                        "type": "uint256"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 15,
                                                                "type": "mapping(address => uint256)",
                                                                "value": "balances"
                                                            },
                                                            "id": 141,
                                                            "name": "Identifier",
                                                            "src": "2180:8:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 105,
                                                                "type": "address",
                                                                "value": "_from"
                                                            },
                                                            "id": 142,
                                                            "name": "Identifier",
                                                            "src": "2189:5:0"
                                                        }
                                                    ],
                                                    "id": 143,
                                                    "name": "IndexAccess",
                                                    "src": "2180:15:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 109,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 144,
                                                    "name": "Identifier",
                                                    "src": "2199:6:0"
                                                }
                                            ],
                                            "id": 145,
                                            "name": "Assignment",
                                            "src": "2180:25:0"
                                        }],
                                        "id": 146,
                                        "name": "ExpressionStatement",
                                        "src": "2180:25:0"
                                    },
                                    {
                                        "attributes": {
                                            "falseBody": null
                                        },
                                        "children": [{
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "commonType": {
                                                        "typeIdentifier": "t_uint256",
                                                        "typeString": "uint256"
                                                    },
                                                    "isConstant": false,
                                                    "isLValue": false,
                                                    "isPure": false,
                                                    "lValueRequested": false,
                                                    "operator": "<",
                                                    "type": "bool"
                                                },
                                                "children": [{
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "overloadedDeclarations": [
                                                                null
                                                            ],
                                                            "referencedDeclaration": 115,
                                                            "type": "uint256",
                                                            "value": "allowance"
                                                        },
                                                        "id": 147,
                                                        "name": "Identifier",
                                                        "src": "2220:9:0"
                                                    },
                                                    {
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "overloadedDeclarations": [
                                                                null
                                                            ],
                                                            "referencedDeclaration": 11,
                                                            "type": "uint256",
                                                            "value": "MAX_UINT256"
                                                        },
                                                        "id": 148,
                                                        "name": "Identifier",
                                                        "src": "2232:11:0"
                                                    }
                                                ],
                                                "id": 149,
                                                "name": "BinaryOperation",
                                                "src": "2220:23:0"
                                            },
                                            {
                                                "children": [{
                                                    "children": [{
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "isConstant": false,
                                                            "isLValue": false,
                                                            "isPure": false,
                                                            "lValueRequested": false,
                                                            "operator": "-=",
                                                            "type": "uint256"
                                                        },
                                                        "children": [{
                                                                "attributes": {
                                                                    "argumentTypes": null,
                                                                    "isConstant": false,
                                                                    "isLValue": true,
                                                                    "isPure": false,
                                                                    "lValueRequested": true,
                                                                    "type": "uint256"
                                                                },
                                                                "children": [{
                                                                        "attributes": {
                                                                            "argumentTypes": null,
                                                                            "isConstant": false,
                                                                            "isLValue": true,
                                                                            "isPure": false,
                                                                            "lValueRequested": false,
                                                                            "type": "mapping(address => uint256)"
                                                                        },
                                                                        "children": [{
                                                                                "attributes": {
                                                                                    "argumentTypes": null,
                                                                                    "overloadedDeclarations": [
                                                                                        null
                                                                                    ],
                                                                                    "referencedDeclaration": 21,
                                                                                    "type": "mapping(address => mapping(address => uint256))",
                                                                                    "value": "allowed"
                                                                                },
                                                                                "id": 150,
                                                                                "name": "Identifier",
                                                                                "src": "2260:7:0"
                                                                            },
                                                                            {
                                                                                "attributes": {
                                                                                    "argumentTypes": null,
                                                                                    "overloadedDeclarations": [
                                                                                        null
                                                                                    ],
                                                                                    "referencedDeclaration": 105,
                                                                                    "type": "address",
                                                                                    "value": "_from"
                                                                                },
                                                                                "id": 151,
                                                                                "name": "Identifier",
                                                                                "src": "2268:5:0"
                                                                            }
                                                                        ],
                                                                        "id": 154,
                                                                        "name": "IndexAccess",
                                                                        "src": "2260:14:0"
                                                                    },
                                                                    {
                                                                        "attributes": {
                                                                            "argumentTypes": null,
                                                                            "isConstant": false,
                                                                            "isLValue": false,
                                                                            "isPure": false,
                                                                            "lValueRequested": false,
                                                                            "member_name": "sender",
                                                                            "referencedDeclaration": null,
                                                                            "type": "address payable"
                                                                        },
                                                                        "children": [{
                                                                            "attributes": {
                                                                                "argumentTypes": null,
                                                                                "overloadedDeclarations": [
                                                                                    null
                                                                                ],
                                                                                "referencedDeclaration": 457,
                                                                                "type": "msg",
                                                                                "value": "msg"
                                                                            },
                                                                            "id": 152,
                                                                            "name": "Identifier",
                                                                            "src": "2275:3:0"
                                                                        }],
                                                                        "id": 153,
                                                                        "name": "MemberAccess",
                                                                        "src": "2275:10:0"
                                                                    }
                                                                ],
                                                                "id": 155,
                                                                "name": "IndexAccess",
                                                                "src": "2260:26:0"
                                                            },
                                                            {
                                                                "attributes": {
                                                                    "argumentTypes": null,
                                                                    "overloadedDeclarations": [
                                                                        null
                                                                    ],
                                                                    "referencedDeclaration": 109,
                                                                    "type": "uint256",
                                                                    "value": "_value"
                                                                },
                                                                "id": 156,
                                                                "name": "Identifier",
                                                                "src": "2290:6:0"
                                                            }
                                                        ],
                                                        "id": 157,
                                                        "name": "Assignment",
                                                        "src": "2260:36:0"
                                                    }],
                                                    "id": 158,
                                                    "name": "ExpressionStatement",
                                                    "src": "2260:36:0"
                                                }],
                                                "id": 159,
                                                "name": "Block",
                                                "src": "2245:63:0"
                                            }
                                        ],
                                        "id": 160,
                                        "name": "IfStatement",
                                        "src": "2216:92:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "isStructConstructorCall": false,
                                                "lValueRequested": false,
                                                "names": [
                                                    null
                                                ],
                                                "type": "tuple()",
                                                "type_conversion": false
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": [{
                                                                "typeIdentifier": "t_address",
                                                                "typeString": "address"
                                                            },
                                                            {
                                                                "typeIdentifier": "t_address",
                                                                "typeString": "address"
                                                            },
                                                            {
                                                                "typeIdentifier": "t_uint256",
                                                                "typeString": "uint256"
                                                            }
                                                        ],
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 284,
                                                        "type": "function (address,address,uint256)",
                                                        "value": "Transfer"
                                                    },
                                                    "id": 161,
                                                    "name": "Identifier",
                                                    "src": "2323:8:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 105,
                                                        "type": "address",
                                                        "value": "_from"
                                                    },
                                                    "id": 162,
                                                    "name": "Identifier",
                                                    "src": "2332:5:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 107,
                                                        "type": "address",
                                                        "value": "_to"
                                                    },
                                                    "id": 163,
                                                    "name": "Identifier",
                                                    "src": "2339:3:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 109,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 164,
                                                    "name": "Identifier",
                                                    "src": "2344:6:0"
                                                }
                                            ],
                                            "id": 165,
                                            "name": "FunctionCall",
                                            "src": "2323:28:0"
                                        }],
                                        "id": 166,
                                        "name": "EmitStatement",
                                        "src": "2318:33:0"
                                    },
                                    {
                                        "attributes": {
                                            "functionReturnParameters": 113
                                        },
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "hexvalue": "74727565",
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": true,
                                                "lValueRequested": false,
                                                "subdenomination": null,
                                                "token": "bool",
                                                "type": "bool",
                                                "value": "true"
                                            },
                                            "id": 167,
                                            "name": "Literal",
                                            "src": "2415:4:0"
                                        }],
                                        "id": 168,
                                        "name": "Return",
                                        "src": "2408:11:0"
                                    }
                                ],
                                "id": 169,
                                "name": "Block",
                                "src": "2010:417:0"
                            }
                        ],
                        "id": 170,
                        "name": "FunctionDefinition",
                        "src": "1914:513:0"
                    },
                    {
                        "attributes": {
                            "documentation": null,
                            "implemented": true,
                            "isConstructor": false,
                            "kind": "function",
                            "modifiers": [
                                null
                            ],
                            "name": "balanceOf",
                            "scope": 227,
                            "stateMutability": "view",
                            "superFunction": 238,
                            "visibility": "public"
                        },
                        "children": [{
                                "children": [{
                                    "attributes": {
                                        "constant": false,
                                        "name": "_owner",
                                        "scope": 182,
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "type": "address",
                                        "value": null,
                                        "visibility": "internal"
                                    },
                                    "children": [{
                                        "attributes": {
                                            "name": "address",
                                            "stateMutability": "nonpayable",
                                            "type": "address"
                                        },
                                        "id": 171,
                                        "name": "ElementaryTypeName",
                                        "src": "2454:7:0"
                                    }],
                                    "id": 172,
                                    "name": "VariableDeclaration",
                                    "src": "2454:14:0"
                                }],
                                "id": 173,
                                "name": "ParameterList",
                                "src": "2453:16:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "constant": false,
                                        "name": "balance",
                                        "scope": 182,
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "type": "uint256",
                                        "value": null,
                                        "visibility": "internal"
                                    },
                                    "children": [{
                                        "attributes": {
                                            "name": "uint256",
                                            "type": "uint256"
                                        },
                                        "id": 174,
                                        "name": "ElementaryTypeName",
                                        "src": "2491:7:0"
                                    }],
                                    "id": 175,
                                    "name": "VariableDeclaration",
                                    "src": "2491:15:0"
                                }],
                                "id": 176,
                                "name": "ParameterList",
                                "src": "2490:17:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "functionReturnParameters": 176
                                    },
                                    "children": [{
                                        "attributes": {
                                            "argumentTypes": null,
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": false,
                                            "type": "uint256"
                                        },
                                        "children": [{
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "overloadedDeclarations": [
                                                        null
                                                    ],
                                                    "referencedDeclaration": 15,
                                                    "type": "mapping(address => uint256)",
                                                    "value": "balances"
                                                },
                                                "id": 177,
                                                "name": "Identifier",
                                                "src": "2526:8:0"
                                            },
                                            {
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "overloadedDeclarations": [
                                                        null
                                                    ],
                                                    "referencedDeclaration": 172,
                                                    "type": "address",
                                                    "value": "_owner"
                                                },
                                                "id": 178,
                                                "name": "Identifier",
                                                "src": "2535:6:0"
                                            }
                                        ],
                                        "id": 179,
                                        "name": "IndexAccess",
                                        "src": "2526:16:0"
                                    }],
                                    "id": 180,
                                    "name": "Return",
                                    "src": "2519:23:0"
                                }],
                                "id": 181,
                                "name": "Block",
                                "src": "2508:42:0"
                            }
                        ],
                        "id": 182,
                        "name": "FunctionDefinition",
                        "src": "2435:115:0"
                    },
                    {
                        "attributes": {
                            "documentation": null,
                            "implemented": true,
                            "isConstructor": false,
                            "kind": "function",
                            "modifiers": [
                                null
                            ],
                            "name": "approve",
                            "scope": 227,
                            "stateMutability": "nonpayable",
                            "superFunction": 267,
                            "visibility": "public"
                        },
                        "children": [{
                                "children": [{
                                        "attributes": {
                                            "constant": false,
                                            "name": "_spender",
                                            "scope": 210,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "address",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "stateMutability": "nonpayable",
                                                "type": "address"
                                            },
                                            "id": 183,
                                            "name": "ElementaryTypeName",
                                            "src": "2575:7:0"
                                        }],
                                        "id": 184,
                                        "name": "VariableDeclaration",
                                        "src": "2575:16:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_value",
                                            "scope": 210,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "uint256",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "uint256",
                                                "type": "uint256"
                                            },
                                            "id": 185,
                                            "name": "ElementaryTypeName",
                                            "src": "2593:7:0"
                                        }],
                                        "id": 186,
                                        "name": "VariableDeclaration",
                                        "src": "2593:14:0"
                                    }
                                ],
                                "id": 187,
                                "name": "ParameterList",
                                "src": "2574:34:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "constant": false,
                                        "name": "success",
                                        "scope": 210,
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "type": "bool",
                                        "value": null,
                                        "visibility": "internal"
                                    },
                                    "children": [{
                                        "attributes": {
                                            "name": "bool",
                                            "type": "bool"
                                        },
                                        "id": 188,
                                        "name": "ElementaryTypeName",
                                        "src": "2625:4:0"
                                    }],
                                    "id": 189,
                                    "name": "VariableDeclaration",
                                    "src": "2625:12:0"
                                }],
                                "id": 190,
                                "name": "ParameterList",
                                "src": "2624:14:0"
                            },
                            {
                                "children": [{
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "lValueRequested": false,
                                                "operator": "=",
                                                "type": "uint256"
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": true,
                                                        "isPure": false,
                                                        "lValueRequested": true,
                                                        "type": "uint256"
                                                    },
                                                    "children": [{
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "isConstant": false,
                                                                "isLValue": true,
                                                                "isPure": false,
                                                                "lValueRequested": false,
                                                                "type": "mapping(address => uint256)"
                                                            },
                                                            "children": [{
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "overloadedDeclarations": [
                                                                            null
                                                                        ],
                                                                        "referencedDeclaration": 21,
                                                                        "type": "mapping(address => mapping(address => uint256))",
                                                                        "value": "allowed"
                                                                    },
                                                                    "id": 191,
                                                                    "name": "Identifier",
                                                                    "src": "2650:7:0"
                                                                },
                                                                {
                                                                    "attributes": {
                                                                        "argumentTypes": null,
                                                                        "isConstant": false,
                                                                        "isLValue": false,
                                                                        "isPure": false,
                                                                        "lValueRequested": false,
                                                                        "member_name": "sender",
                                                                        "referencedDeclaration": null,
                                                                        "type": "address payable"
                                                                    },
                                                                    "children": [{
                                                                        "attributes": {
                                                                            "argumentTypes": null,
                                                                            "overloadedDeclarations": [
                                                                                null
                                                                            ],
                                                                            "referencedDeclaration": 457,
                                                                            "type": "msg",
                                                                            "value": "msg"
                                                                        },
                                                                        "id": 192,
                                                                        "name": "Identifier",
                                                                        "src": "2658:3:0"
                                                                    }],
                                                                    "id": 193,
                                                                    "name": "MemberAccess",
                                                                    "src": "2658:10:0"
                                                                }
                                                            ],
                                                            "id": 195,
                                                            "name": "IndexAccess",
                                                            "src": "2650:19:0"
                                                        },
                                                        {
                                                            "attributes": {
                                                                "argumentTypes": null,
                                                                "overloadedDeclarations": [
                                                                    null
                                                                ],
                                                                "referencedDeclaration": 184,
                                                                "type": "address",
                                                                "value": "_spender"
                                                            },
                                                            "id": 194,
                                                            "name": "Identifier",
                                                            "src": "2670:8:0"
                                                        }
                                                    ],
                                                    "id": 196,
                                                    "name": "IndexAccess",
                                                    "src": "2650:29:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 186,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 197,
                                                    "name": "Identifier",
                                                    "src": "2682:6:0"
                                                }
                                            ],
                                            "id": 198,
                                            "name": "Assignment",
                                            "src": "2650:38:0"
                                        }],
                                        "id": 199,
                                        "name": "ExpressionStatement",
                                        "src": "2650:38:0"
                                    },
                                    {
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": false,
                                                "isStructConstructorCall": false,
                                                "lValueRequested": false,
                                                "names": [
                                                    null
                                                ],
                                                "type": "tuple()",
                                                "type_conversion": false
                                            },
                                            "children": [{
                                                    "attributes": {
                                                        "argumentTypes": [{
                                                                "typeIdentifier": "t_address_payable",
                                                                "typeString": "address payable"
                                                            },
                                                            {
                                                                "typeIdentifier": "t_address",
                                                                "typeString": "address"
                                                            },
                                                            {
                                                                "typeIdentifier": "t_uint256",
                                                                "typeString": "uint256"
                                                            }
                                                        ],
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 292,
                                                        "type": "function (address,address,uint256)",
                                                        "value": "Approval"
                                                    },
                                                    "id": 200,
                                                    "name": "Identifier",
                                                    "src": "2704:8:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "isConstant": false,
                                                        "isLValue": false,
                                                        "isPure": false,
                                                        "lValueRequested": false,
                                                        "member_name": "sender",
                                                        "referencedDeclaration": null,
                                                        "type": "address payable"
                                                    },
                                                    "children": [{
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "overloadedDeclarations": [
                                                                null
                                                            ],
                                                            "referencedDeclaration": 457,
                                                            "type": "msg",
                                                            "value": "msg"
                                                        },
                                                        "id": 201,
                                                        "name": "Identifier",
                                                        "src": "2713:3:0"
                                                    }],
                                                    "id": 202,
                                                    "name": "MemberAccess",
                                                    "src": "2713:10:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 184,
                                                        "type": "address",
                                                        "value": "_spender"
                                                    },
                                                    "id": 203,
                                                    "name": "Identifier",
                                                    "src": "2725:8:0"
                                                },
                                                {
                                                    "attributes": {
                                                        "argumentTypes": null,
                                                        "overloadedDeclarations": [
                                                            null
                                                        ],
                                                        "referencedDeclaration": 186,
                                                        "type": "uint256",
                                                        "value": "_value"
                                                    },
                                                    "id": 204,
                                                    "name": "Identifier",
                                                    "src": "2735:6:0"
                                                }
                                            ],
                                            "id": 205,
                                            "name": "FunctionCall",
                                            "src": "2704:38:0"
                                        }],
                                        "id": 206,
                                        "name": "EmitStatement",
                                        "src": "2699:43:0"
                                    },
                                    {
                                        "attributes": {
                                            "functionReturnParameters": 190
                                        },
                                        "children": [{
                                            "attributes": {
                                                "argumentTypes": null,
                                                "hexvalue": "74727565",
                                                "isConstant": false,
                                                "isLValue": false,
                                                "isPure": true,
                                                "lValueRequested": false,
                                                "subdenomination": null,
                                                "token": "bool",
                                                "type": "bool",
                                                "value": "true"
                                            },
                                            "id": 207,
                                            "name": "Literal",
                                            "src": "2806:4:0"
                                        }],
                                        "id": 208,
                                        "name": "Return",
                                        "src": "2799:11:0"
                                    }
                                ],
                                "id": 209,
                                "name": "Block",
                                "src": "2639:179:0"
                            }
                        ],
                        "id": 210,
                        "name": "FunctionDefinition",
                        "src": "2558:260:0"
                    },
                    {
                        "attributes": {
                            "documentation": null,
                            "implemented": true,
                            "isConstructor": false,
                            "kind": "function",
                            "modifiers": [
                                null
                            ],
                            "name": "allowance",
                            "scope": 227,
                            "stateMutability": "view",
                            "superFunction": 276,
                            "visibility": "public"
                        },
                        "children": [{
                                "children": [{
                                        "attributes": {
                                            "constant": false,
                                            "name": "_owner",
                                            "scope": 226,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "address",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "stateMutability": "nonpayable",
                                                "type": "address"
                                            },
                                            "id": 211,
                                            "name": "ElementaryTypeName",
                                            "src": "2845:7:0"
                                        }],
                                        "id": 212,
                                        "name": "VariableDeclaration",
                                        "src": "2845:14:0"
                                    },
                                    {
                                        "attributes": {
                                            "constant": false,
                                            "name": "_spender",
                                            "scope": 226,
                                            "stateVariable": false,
                                            "storageLocation": "default",
                                            "type": "address",
                                            "value": null,
                                            "visibility": "internal"
                                        },
                                        "children": [{
                                            "attributes": {
                                                "name": "address",
                                                "stateMutability": "nonpayable",
                                                "type": "address"
                                            },
                                            "id": 213,
                                            "name": "ElementaryTypeName",
                                            "src": "2861:7:0"
                                        }],
                                        "id": 214,
                                        "name": "VariableDeclaration",
                                        "src": "2861:16:0"
                                    }
                                ],
                                "id": 215,
                                "name": "ParameterList",
                                "src": "2844:34:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "constant": false,
                                        "name": "remaining",
                                        "scope": 226,
                                        "stateVariable": false,
                                        "storageLocation": "default",
                                        "type": "uint256",
                                        "value": null,
                                        "visibility": "internal"
                                    },
                                    "children": [{
                                        "attributes": {
                                            "name": "uint256",
                                            "type": "uint256"
                                        },
                                        "id": 216,
                                        "name": "ElementaryTypeName",
                                        "src": "2900:7:0"
                                    }],
                                    "id": 217,
                                    "name": "VariableDeclaration",
                                    "src": "2900:17:0"
                                }],
                                "id": 218,
                                "name": "ParameterList",
                                "src": "2899:19:0"
                            },
                            {
                                "children": [{
                                    "attributes": {
                                        "functionReturnParameters": 218
                                    },
                                    "children": [{
                                        "attributes": {
                                            "argumentTypes": null,
                                            "isConstant": false,
                                            "isLValue": true,
                                            "isPure": false,
                                            "lValueRequested": false,
                                            "type": "uint256"
                                        },
                                        "children": [{
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "isConstant": false,
                                                    "isLValue": true,
                                                    "isPure": false,
                                                    "lValueRequested": false,
                                                    "type": "mapping(address => uint256)"
                                                },
                                                "children": [{
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "overloadedDeclarations": [
                                                                null
                                                            ],
                                                            "referencedDeclaration": 21,
                                                            "type": "mapping(address => mapping(address => uint256))",
                                                            "value": "allowed"
                                                        },
                                                        "id": 219,
                                                        "name": "Identifier",
                                                        "src": "2937:7:0"
                                                    },
                                                    {
                                                        "attributes": {
                                                            "argumentTypes": null,
                                                            "overloadedDeclarations": [
                                                                null
                                                            ],
                                                            "referencedDeclaration": 212,
                                                            "type": "address",
                                                            "value": "_owner"
                                                        },
                                                        "id": 220,
                                                        "name": "Identifier",
                                                        "src": "2945:6:0"
                                                    }
                                                ],
                                                "id": 221,
                                                "name": "IndexAccess",
                                                "src": "2937:15:0"
                                            },
                                            {
                                                "attributes": {
                                                    "argumentTypes": null,
                                                    "overloadedDeclarations": [
                                                        null
                                                    ],
                                                    "referencedDeclaration": 214,
                                                    "type": "address",
                                                    "value": "_spender"
                                                },
                                                "id": 222,
                                                "name": "Identifier",
                                                "src": "2953:8:0"
                                            }
                                        ],
                                        "id": 223,
                                        "name": "IndexAccess",
                                        "src": "2937:25:0"
                                    }],
                                    "id": 224,
                                    "name": "Return",
                                    "src": "2930:32:0"
                                }],
                                "id": 225,
                                "name": "Block",
                                "src": "2919:51:0"
                            }
                        ],
                        "id": 226,
                        "name": "FunctionDefinition",
                        "src": "2826:144:0"
                    }
                ],
                "id": 227,
                "name": "ContractDefinition",
                "src": "179:2794:0"
            }
        ],
        "id": 228,
        "name": "SourceUnit",
        "src": "107:2866:0"
    },
    "compiler": {
        "name": "solc",
        "version": "0.5.16+commit.9c3226ce.Emscripten.clang"
    },
    "networks": {
        "5777": {
            "events": {},
            "links": {},
            "address": "0x9F5DCF324115ADEA9f12Ff8C776234Fc2703e501",
            "transactionHash": "0xbfc2f16384501c8132a6f01a1bd40e882335ca6cfae92d1d85fba29f98e0de44"
        }
    },
    "schemaVersion": "3.4.1",
    "updatedAt": "2021-05-19T03:52:16.167Z",
    "networkType": "ethereum",
    "devdoc": {
        "methods": {}
    },
    "userdoc": {
        "methods": {}
    }
};