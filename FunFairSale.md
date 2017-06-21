# FunFairSale

```javascript
// BK WARNING - Following should be at least ^0.4.11 . Noted that this contract is deployed with v0.4.11+commit.68ef5810 at
//              https://etherscan.io/address/0x5c84c9dd997e16578e62c9f7557e708db05c1076#code 
pragma solidity ^0.4.4;

// BK Ok - Fragment of functions required from the ERC20 standard
//    https://github.com/ethereum/EIPs/issues/20
contract Token {
    // BK Ok
    function transfer(address _to, uint _value) returns (bool);
    // BK Ok
    function balanceOf(address owner) returns(uint);
}

// BK Ok - Standard Owned/Owner pattern, with `acceptOwnership()` protection from transfer errors
contract Owned {
    // BK Ok
    address public owner;

    // BK Ok - Constructor sets the owner
    function Owned() {
        owner = msg.sender;
    }

    // BK Ok - This modifier throws an error for non-owners
    modifier onlyOwner() {
        if (msg.sender != owner) throw;
        _;
    }

    // BK Ok
    address newOwner;

    // BK Ok - Only owner can assign new proposed owner
    function changeOwner(address _newOwner) onlyOwner {
        newOwner = _newOwner;
    }

    // BK Ok - Only new proposed owner can accept ownership 
    function acceptOwnership() {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}

// BK Ok - Provides functionality for the contract owner to be able to retrieve
//         tokens accidentally sent to the contract address
contract TokenReceivable is Owned {
    // BK Ok - Event for logging
    event logTokenTransfer(address token, address to, uint amount);

    // BK Ok - Only contract owner can execute this
    function claimTokens(address _token, address _to) onlyOwner returns (bool) {
        // BK Ok
        Token token = Token(_token);
        // BK Ok - Token balance for this contract address
        uint balance = token.balanceOf(this);
        // BK Ok - Transfer full balance
        if (token.transfer(_to, balance)) {
            // BK Log transfer and exit
            logTokenTransfer(_token, _to, balance);
            return true;
        }
        return false;
    }
}

contract FunFairSale is Owned, TokenReceivable {
    // BK Ok - End time = start time + sale period . Set in the constructor
    uint public deadline;
    // BK Ok - Start time
    uint public startTime = 123123; //set actual time here
    // BK Ok - Sale period
    uint public saleTime = 14 days;
    uint public capAmount;

    // BK Ok - Constructor
    function FunFairSale() {
        // BK Ok - End time = start time + sale period
        deadline = startTime + saleTime;
    }

    // BK Ok - Owner can only move the end time forward, i.e., extend the crowdsale period
    //         even when the soft cap is reached
    function setSoftCapDeadline(uint t) onlyOwner {
        // BK Ok - Cannot change deadline once past it
        if (t > deadline) throw;
        // BK Ok
        deadline = t;
    }

    // BK - Cap amount is initially set to 0. 
    function launch(uint _cap) onlyOwner {
        // cap is immutable once the sale starts
        // BK Ok - Cap cannot be set once collection has commenced
        if (this.balance > 0) throw;
        // BK Ok
        capAmount = _cap;
    }

    // BK NOTE - Double counting of msg.value
    function () payable {
        // BK Ok - Cannot contribute before start and after end
        if (block.timestamp < startTime || block.timestamp >= deadline) throw;
        // BK Ok - Cannot contribute more than the cap
        if (this.balance >= capAmount) throw;
        // BK NOTE - this.balance already includes msg.value, resulting in msg.value being double counted
        if (this.balance + msg.value >= capAmount) {
            // BK Ok - Ending crowdsale once the cap is reached
            deadline = block.timestamp;
        }
    }

    // BK TO CHECK - See below
    function withdraw() onlyOwner {
        // BK Ok - Cannot withdraw before the sale ends
        if (block.timestamp < deadline) throw;
        // BK TO CHECK - Should use `transfer()` or `send()` with a throw
        if (!owner.call.value(this.balance)()) throw;
    }

    // for testing
    // BK NOTE This allows the owner to set any start and end times
    function setStartTime(uint _startTime, uint _deadline) onlyOwner {
        // BK Ok - Cannot set end time before the start time
    	if (_deadline < _startTime) throw;
    	// BK Next 2 lines Ok
        startTime = _startTime;
        deadline = _deadline;
    }

}
```