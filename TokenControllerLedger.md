# Token, Controller And Ledger

```javascript
// BK WARNING - Following should be at least ^0.4.11 . Noted that these contract are deployed with v0.4.11+commit.68ef5810 at
//              Token https://etherscan.io/address/0xc69071e982fb7bc136accc86169da8dbdf705220#code
//              Controller https://etherscan.io/address/0xc9b3378516d0c7a622ff325dd3dfd60b50f7a74c#code
//              Ledger https://etherscan.io/address/0x29b77fa51f36991f99bbeb702471b7227510d05a#code
pragma solidity >=0.4.4;

//from Zeppelin
contract SafeMath {
    // BK Ok
    function safeMul(uint a, uint b) internal returns (uint) {
        uint c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }

    // BK Ok
    function safeSub(uint a, uint b) internal returns (uint) {
        // BK b must be less than or equals to a
        assert(b <= a);
        return a - b;
    }

    // BK Ok
    function safeAdd(uint a, uint b) internal returns (uint) {
        uint c = a + b;
        // BK c must be more than or equal to a or b
        assert(c>=a && c>=b);
        return c;
    }

    // BK Ok - This is built in for Solidity 0.4.11
    function assert(bool assertion) internal {
        if (!assertion) throw;
    }
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

contract Finalizable is Owned {
    bool public finalized;

    // BK Ok - Only the owner is able to finalise a contract
    function finalize() onlyOwner {
        finalized = true;
    }

    // BK Ok - Modifier the prvent functions to be executed once a contract is finalised
    modifier notFinalized() {
        if (finalized) throw;
        _;
    }
}

// BK Ok - Fragment of functions required from the ERC20 standard
//    https://github.com/ethereum/EIPs/issues/20
contract IToken {
    // BK Ok
    function transfer(address _to, uint _value) returns (bool);
    // BK Ok
    function balanceOf(address owner) returns(uint);
}

// BK Ok - Provides functionality for the contract owner to be able to retrieve
//         tokens accidentally sent to the contract address
contract TokenReceivable is Owned {
    // BK Ok - Event for logging
    event logTokenTransfer(address token, address to, uint amount);

    // BK Ok - Only contract owner can execute this
    function claimTokens(address _token, address _to) onlyOwner returns (bool) {
        // BK Ok
        IToken token = IToken(_token);
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

// BK Ok - Fragment of events required from the ERC20 standard
//    https://github.com/ethereum/EIPs/issues/20
contract EventDefinitions {
    // BK Ok
    event Transfer(address indexed from, address indexed to, uint value);
    // BK Ok
    event Approval(address indexed owner, address indexed spender, uint value);
}

// BK - The owner cannot change the controller once this contract is finalised
contract Token is Finalizable, TokenReceivable, SafeMath, EventDefinitions {

    // BK Ok
    string public name = "FunFair";
    // BK Ok - Matches the correct `uint8` instead of `uint` which is `uint256`
    uint8 public decimals = 8;
    // BK Ok
    string public symbol = "FUN";

    // BK Ok
    Controller controller;
    // BK NOTE There are two declarations for owner. This can cause a problem
    //         but does not seem to be the case in this contract
    address owner;

    // BK Ok - Only owner if not finalised
    function setController(address _c) onlyOwner notFinalized {
        controller = Controller(_c);
    }

    // BK Ok
    function balanceOf(address a) constant returns (uint) {
        return controller.balanceOf(a);
    }

    // BK Ok
    function totalSupply() constant returns (uint) {
        return controller.totalSupply();
    }

    // BK Ok
    function allowance(address _owner, address _spender) constant returns (uint) {
        return controller.allowance(_owner, _spender);
    }

    // BK Ok - success value returned
    function transfer(address _to, uint _value)
    onlyPayloadSize(2)
    returns (bool success) {
       success = controller.transfer(msg.sender, _to, _value);
        if (success) {
            Transfer(msg.sender, _to, _value);
        }
    }

    // BK Ok - success value returned 
    function transferFrom(address _from, address _to, uint _value)
    onlyPayloadSize(3)
    returns (bool success) {
       success = controller.transferFrom(msg.sender, _from, _to, _value);
        if (success) {
            Transfer(_from, _to, _value);
        }
    }

    // BK Ok - success value returned, but a non-zero allowance() will throw
    function approve(address _spender, uint _value)
    onlyPayloadSize(2)
    returns (bool success) {
        //promote safe user behavior
        if (controller.allowance(msg.sender, _spender) > 0) throw;

        success = controller.approve(msg.sender, _spender, _value);
        if (success) {
            Approval(msg.sender, _spender, _value);
        }
    }

    // BK Ok - success value returned 
    function increaseApproval (address _spender, uint _addedValue)
    onlyPayloadSize(2)
    returns (bool success) {
        success = controller.increaseApproval(msg.sender, _spender, _addedValue);
        if (success) {
            uint newval = controller.allowance(msg.sender, _spender);
            Approval(msg.sender, _spender, newval);
        }
    }

    // BK Ok - success value returned
    function decreaseApproval (address _spender, uint _subtractedValue)
    onlyPayloadSize(2)
    returns (bool success) {
        success = controller.decreaseApproval(msg.sender, _spender, _subtractedValue);
        if (success) {
            uint newval = controller.allowance(msg.sender, _spender);
            Approval(msg.sender, _spender, newval);
        }
    }

    // BK Ok
    modifier onlyPayloadSize(uint numwords) {
    assert(msg.data.length == numwords * 32 + 4);
        _;
    }

}

// BK NOTE - The notFinalized() modifier from the class Finalizable is not used
contract Controller is Owned, Finalizable {
    // BK Next 2 lines Ok
    Ledger public ledger;
    address public token;

    // BK Ok - Only owner
    function setToken(address _token) onlyOwner {
        token = _token;
    }

    // BK Ok - Only owner
    function setLedger(address _ledger) onlyOwner {
        ledger = Ledger(_ledger);
    }

    // BK Ok - For token contract to call these functions
    modifier onlyToken() {
        if (msg.sender != token) throw;
        _;
    }

    // BK Ok
    function totalSupply() constant returns (uint) {
        return ledger.totalSupply();
    }

    // BK Ok
    function balanceOf(address _a) onlyToken constant returns (uint) {
        return Ledger(ledger).balanceOf(_a);
    }

    // BK Ok
    function allowance(address _owner, address _spender)
    onlyToken constant returns (uint) {
        return ledger.allowance(_owner, _spender);
    }

    // BK Ok
    function transfer(address _from, address _to, uint _value)
    onlyToken
    returns (bool success) {
        return ledger.transfer(_from, _to, _value);
    }

    // BK Ok
    function transferFrom(address _spender, address _from, address _to, uint _value)
    onlyToken
    returns (bool success) {
        return ledger.transferFrom(_spender, _from, _to, _value);
    }

    // BK Ok
    function approve(address _owner, address _spender, uint _value)
    onlyToken
    returns (bool success) {
        return ledger.approve(_owner, _spender, _value);
    }

    // BK Ok
    function increaseApproval (address _owner, address _spender, uint _addedValue)
    onlyToken
    returns (bool success) {
        return ledger.increaseApproval(_owner, _spender, _addedValue);
    }

    // BK Ok
    function decreaseApproval (address _owner, address _spender, uint _subtractedValue)
    onlyToken
    returns (bool success) {
        return ledger.decreaseApproval(_owner, _spender, _subtractedValue);
    }
}

// BK - The owner cannot change the controller once this contract is finalised 
// BK - The owner cannot mint tokens once this contract is finalised
contract Ledger is Owned, SafeMath, Finalizable {
    // BK Next 4 lines Ok
    address public controller;
    mapping(address => uint) public balanceOf;
    mapping (address => mapping (address => uint)) public allowance;
    uint public totalSupply;

    // BK Ok
    function setController(address _controller) onlyOwner notFinalized {
        controller = _controller;
    }

    // BK Ok
    modifier onlyController() {
        if (msg.sender != controller) throw;
        _;
    }

    // BK Ok
    function transfer(address _from, address _to, uint _value)
    onlyController
    returns (bool success) {
        if (balanceOf[_from] < _value) return false;

        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        return true;
    }

    // BK Ok
    function transferFrom(address _spender, address _from, address _to, uint _value)
    onlyController
    returns (bool success) {
        if (balanceOf[_from] < _value) return false;

        var allowed = allowance[_from][_spender];
        if (allowed < _value) return false;

        balanceOf[_to] = safeAdd(balanceOf[_to], _value);
        balanceOf[_from] = safeSub(balanceOf[_from], _value);
        allowance[_from][_spender] = safeSub(allowed, _value);
        return true;
    }

    // BK Ok - Cannot set non-zero value
    function approve(address _owner, address _spender, uint _value)
    onlyController
    returns (bool success) {
        //require user to set to zero before resetting to nonzero
        if ((_value != 0) && (allowance[_owner][_spender] != 0)) {
            return false;
        }

        allowance[_owner][_spender] = _value;
        return true;
    }

    // BK Ok
    function increaseApproval (address _owner, address _spender, uint _addedValue)
    onlyController
    returns (bool success) {
        uint oldValue = allowance[_owner][_spender];
        allowance[_owner][_spender] = safeAdd(oldValue, _addedValue);
        return true;
    }

    // BK Ok
    function decreaseApproval (address _owner, address _spender, uint _subtractedValue)
    onlyController
    returns (bool success) {
        uint oldValue = allowance[_owner][_spender];
        if (_subtractedValue > oldValue) {
            allowance[_owner][_spender] = 0;
        } else {
            allowance[_owner][_spender] = safeSub(oldValue, _subtractedValue);
        }
        return true;
    }

    // BK Only owner can mint when not finalised
    function mint(address _a, uint _amount) onlyOwner notFinalized {
        balanceOf[_a] = safeAdd(balanceOf[_a], _amount);
        totalSupply = safeAdd(totalSupply, _amount);
    }

    // BK Only owner can mint when not finalised
    function multiMint(uint[] bits) onlyOwner notFinalized {
        for (uint i=0; i<bits.length; i++) {
	    address a = address(bits[i]>>96);
	    uint amount = bits[i]&((1<<96) - 1);
	    mint(a, amount);
        }
    }
}
```