// Jun 12 2017
var ethPriceUSD = 380.39;

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Contract Owner");
addAccount(eth.accounts[2], "Account #2 - KYCed");
addAccount(eth.accounts[3], "Account #3 - KYCed");
addAccount(eth.accounts[4], "Account #4");
addAccount(eth.accounts[5], "Account #5");
addAccount(eth.accounts[6], "Account #6");
addAccount(eth.accounts[7], "Account #7");
addAccount(eth.accounts[8], "Account #8");
// addAccount(eth.accounts[9], "Account #9 - Crowdfund Wallet");
// addAccount(eth.accounts[10], "Account #10 - Foundation");
// addAccount(eth.accounts[11], "Account #11 - Advisors");
// addAccount(eth.accounts[12], "Account #12 - Directors");
// addAccount(eth.accounts[13], "Account #13 - Early Backers");
// addAccount(eth.accounts[14], "Account #14 - Developers");
// addAccount(eth.accounts[15], "Account #15 - Precommitments");
// addAccount(eth.accounts[16], "Account #16 - Tranche 2 Locked");
// addAccount("0x0000000000000000000000000000000000000000", "Burn Account");



var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var account2 = eth.accounts[2];
var account3 = eth.accounts[3];
var account4 = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var account7 = eth.accounts[7];
var account8 = eth.accounts[8];
// var crowdfundWallet = eth.accounts[9];
// var foundationAccount = eth.accounts[10];
// var advisorsAccount = eth.accounts[11];
// var directorsAccount = eth.accounts[12];
// var earlyBackersAccount = eth.accounts[13];
// var developersAccount = eth.accounts[14];
// var precommitmentsAccount = eth.accounts[15];
// var tranche2Account = eth.accounts[16];

var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < eth.accounts.length; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
  }
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;
var lockedTokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi, lockedTokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
  lockedTokenContractAbi = lockedTokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 18 : token.decimals();
  var i = 0;
  var totalTokenBalance = new BigNumber(0);
  console.log("RESULT:  # Account                                             EtherBalanceChange                          Token Name");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  accounts.forEach(function(e) {
    i++;
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    totalTokenBalance = totalTokenBalance.add(tokenBalance);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + accountNames[e]);
  });
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT:                                                                           " + padToken(totalTokenBalance, decimals) + " Total Token Balances");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT: ");
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  console.log("RESULT: " + name + " gas=" + tx.gas + " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH +
    " costUSD=" + gasCostUSD + " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + gasPrice + " block=" + 
    txReceipt.blockNumber + " txId=" + txId);
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


//-----------------------------------------------------------------------------
// FFS Contract
//-----------------------------------------------------------------------------
var ffsContractAddress = null;
var ffsContractAbi = null;

function addFfsContractAddressAndAbi(address, abi) {
  ffsContractAddress = address;
  ffsContractAbi = abi;
}

function printFfsContractDetails() {
  console.log("RESULT: ffsContractAddress=" + ffsContractAddress);
  console.log("RESULT: ffsContractAbi=" + JSON.stringify(ffsContractAbi));
  if (ffsContractAddress != null && ffsContractAbi != null) {
    var contract = eth.contract(ffsContractAbi).at(ffsContractAddress);
    console.log("RESULT: ffs.owner=" + contract.owner());
    // NOT PUBLIC console.log("RESULT: ffs.newOwner=" + contract.newOwner());
    var startTime = contract.startTime();
    console.log("RESULT: ffs.startTime=" + startTime + " " + new Date(startTime * 1000).toUTCString()  + 
        " / " + new Date(startTime * 1000).toGMTString());
    var deadline = contract.deadline();
    console.log("RESULT: ffs.deadline=" + deadline + " " + new Date(deadline * 1000).toUTCString() + 
        " / " + new Date(deadline * 1000).toGMTString());
    console.log("RESULT: ffs.capAmount=" + contract.capAmount().shift(-18));
  }
}




// -----------------------------------------------------------------------------
// Token Contract details
// -----------------------------------------------------------------------------
function printTokenContractStaticDetails() {
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var decimals = contract.decimals();
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.DECIMALSFACTOR=" + contract.DECIMALSFACTOR());
    var startDate = contract.START_DATE();
    console.log("RESULT: token.START_DATE=" + startDate + " " + new Date(startDate * 1000).toUTCString()  + 
        " / " + new Date(startDate * 1000).toGMTString());
    var endDate = contract.END_DATE();
    console.log("RESULT: token.END_DATE=" + endDate + " " + new Date(endDate * 1000).toUTCString() + 
        " / " + new Date(endDate * 1000).toGMTString());
    console.log("RESULT: token.TOKENS_SOFT_CAP=" + contract.TOKENS_SOFT_CAP().shift(-decimals));
    console.log("RESULT: token.TOKENS_HARD_CAP=" + contract.TOKENS_HARD_CAP().shift(-decimals));
    console.log("RESULT: token.TOKENS_TOTAL=" + contract.TOKENS_TOTAL().shift(-decimals));
  }
}

var dynamicDetailsFromBlock = 0;
function printTokenContractDynamicDetails() {
  if (tokenContractAddress != null && tokenContractAbi != null && lockedTokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var lockedTokenContract = eth.contract(lockedTokenContractAbi).at(contract.lockedTokens());
    var decimals = contract.decimals();
    console.log("RESULT: token.finalised=" + contract.finalised());
    console.log("RESULT: token.tokensPerKEther=" + contract.tokensPerKEther());
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-decimals));
    console.log("RESULT: token.totalSupplyLocked(1Y/2Y)=" + contract.totalSupplyLocked1Y().shift(-decimals) + " / " + contract.totalSupplyLocked2Y().shift(-decimals));
    console.log("RESULT: token.totalSupplyLocked=" + contract.totalSupplyLocked().shift(-decimals));
    console.log("RESULT: token.totalSupplyUnlocked=" + contract.totalSupplyUnlocked().shift(-decimals));
    console.log("RESULT: token.balanceOfLocked(earlyBackersAccount)(1Y/2Y)=" + contract.balanceOfLocked1Y(earlyBackersAccount).shift(-decimals) + " / " + 
        contract.balanceOfLocked2Y(earlyBackersAccount).shift(-decimals));
    console.log("RESULT: token.balanceOfLocked(developersAccount)(1Y/2Y)=" + contract.balanceOfLocked1Y(developersAccount).shift(-decimals) + " / " + 
        contract.balanceOfLocked2Y(developersAccount).shift(-decimals));
    var locked1YDate = contract.LOCKED_1Y_DATE();
    console.log("RESULT: token.LOCKED_1Y_DATE=" + locked1YDate + " " + new Date(locked1YDate * 1000).toUTCString()  + 
        " / " + new Date(locked1YDate * 1000).toGMTString());
    var locked2YDate = contract.LOCKED_2Y_DATE();
    console.log("RESULT: token.LOCKED_2Y_DATE=" + locked2YDate + " " + new Date(locked2YDate * 1000).toUTCString() + 
        " / " + new Date(locked2YDate * 1000).toGMTString());
    console.log("RESULT: lockedToken.TOKENS_LOCKED_1Y_TOTAL=" + lockedTokenContract.TOKENS_LOCKED_1Y_TOTAL().shift(-decimals));
    console.log("RESULT: lockedToken.TOKENS_LOCKED_2Y_TOTAL=" + lockedTokenContract.TOKENS_LOCKED_2Y_TOTAL().shift(-decimals));
    console.log("RESULT: lockedToken.totalSupplyLocked1Y=" + lockedTokenContract.totalSupplyLocked1Y().shift(-decimals));
    console.log("RESULT: lockedToken.totalSupplyLocked2Y=" + lockedTokenContract.totalSupplyLocked2Y().shift(-decimals));
    console.log("RESULT: lockedToken.totalSupplyLocked=" + lockedTokenContract.totalSupplyLocked().shift(-decimals));
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.newOwner=" + contract.newOwner());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvent = contract.OwnershipTransferred({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvent.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred Event " + i++ + ": from=" + result.args._from + " to=" + result.args._to + " " +
        result.blockNumber);
    });
    ownershipTransferredEvent.stopWatching();

    var tokensPerKEtherUpdatedEvent = contract.TokensPerKEtherUpdated({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    tokensPerKEtherUpdatedEvent.watch(function (error, result) {
      console.log("RESULT: TokensPerKEtherUpdated Event " + i++ + ": tokensPerKEther=" + result.args.tokensPerKEther + " block=" + result.blockNumber);
    });
    tokensPerKEtherUpdatedEvent.stopWatching();

    var walletUpdatedEvent = contract.WalletUpdated({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    walletUpdatedEvent.watch(function (error, result) {
      console.log("RESULT: WalletUpdated Event " + i++ + ": from=" + result.args.newWallet + " block=" + result.blockNumber);
    });
    walletUpdatedEvent.stopWatching();

    var precommitmentAddedEvent = contract.PrecommitmentAdded({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    precommitmentAddedEvent.watch(function (error, result) {
      console.log("RESULT: PrecommitmentAdded Event " + i++ + ": participant=" + result.args.participant + 
        " balance=" + result.args.balance.shift(-decimals) + 
        " block=" + result.blockNumber);
    });
    precommitmentAddedEvent.stopWatching();

    var tokensBoughtEvent = contract.TokensBought({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    tokensBoughtEvent.watch(function (error, result) {
      console.log("RESULT: TokensBought Event " + i++ + ": buyer=" + result.args.buyer + 
        " ethers=" + web3.fromWei(result.args.ethers, "ether") +
        " newEtherBalance=" + web3.fromWei(result.args.newEtherBalance, "ether") + 
        " tokens=" + result.args.tokens.shift(-decimals) + 
        " newTotalSupply=" + result.args.newTotalSupply.shift(-decimals) + 
        " tokensPerKEther=" + result.args.tokensPerKEther + 
        " block=" + result.blockNumber);
    });
    tokensBoughtEvent.stopWatching();

    var kycVerifiedEvent = contract.KycVerified({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    kycVerifiedEvent.watch(function (error, result) {
      console.log("RESULT: KycVerified Event " + i++ + ": participant=" + result.args.participant + " block=" + result.blockNumber);
    });
    kycVerifiedEvent.stopWatching();

    var approvalEvent = contract.Approval({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvent.watch(function (error, result) {
      console.log("RESULT: Approval Event " + i++ + ": owner=" + result.args._owner + " spender=" + result.args._spender + " " +
        result.args._value.shift(-decimals) + " block=" + result.blockNumber);
    });
    approvalEvent.stopWatching();

    var transferEvent = contract.Transfer({}, { fromBlock: dynamicDetailsFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvent.watch(function (error, result) {
      console.log("RESULT: Transfer Event " + i++ + ": from=" + result.args._from + " to=" + result.args._to +
        " value=" + result.args._value.shift(-decimals) + " block=" + result.blockNumber);
    });
    transferEvent.stopWatching();
    dynamicDetailsFromBlock = latestBlock + 1;
  }
}
