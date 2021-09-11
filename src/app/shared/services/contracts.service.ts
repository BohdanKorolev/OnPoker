import {Injectable} from '@angular/core';
import {EthereumService} from "./ethereum.service";
import {ApiService} from "./api.service";
import {combineLatest, from, Observable} from "rxjs";
import {map, shareReplay, switchMap, tap} from "rxjs/operators";
import {ethers} from "ethers";
import * as _ from "lodash";
import {fromPromise} from "rxjs/internal-compatibility";
import {CreditPortfolioInfo} from "./balance.service";
import {formatUnits} from "ethers/lib/utils";

const ERC20Abi = [
  {
    "inputs": [{"internalType": "address", "name": "_controller", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {
      "indexed": true,
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "Approval",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}],
    "name": "Paused",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "indexed": true,
      "internalType": "bytes32",
      "name": "previousAdminRole",
      "type": "bytes32"
    }, {"indexed": true, "internalType": "bytes32", "name": "newAdminRole", "type": "bytes32"}],
    "name": "RoleAdminChanged",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "indexed": true,
      "internalType": "address",
      "name": "account",
      "type": "address"
    }, {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}],
    "name": "RoleGranted",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "indexed": true,
      "internalType": "address",
      "name": "account",
      "type": "address"
    }, {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}],
    "name": "RoleRevoked",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    }, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "Transfer",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}],
    "name": "Unpaused",
    "type": "event"
  }, {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "MINTER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "PAUSER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }], "name": "borrowDecrease", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }], "name": "borrowIncrease", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {
      "internalType": "uint256",
      "name": "subtractedValue",
      "type": "uint256"
    }],
    "name": "decreaseAllowance",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
    "name": "getRoleAdmin",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "uint256",
      "name": "index",
      "type": "uint256"
    }],
    "name": "getRoleMember",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
    "name": "getRoleMemberCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }], "name": "grantRole", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {
      "internalType": "uint256",
      "name": "addedValue",
      "type": "uint256"
    }],
    "name": "increaseAllowance",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }, {"inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }], "name": "renounceRole", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }], "name": "revokeRole", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }], "name": "stakeDecrease", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }], "name": "stakeIncrease", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }, {
    "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
    "name": "supportsInterface",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "recipient", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "sender", "type": "address"}, {
      "internalType": "address",
      "name": "recipient",
      "type": "address"
    }, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "userBorrow",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "userStake",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }];
const collateralAbi = [
  {
    "inputs": [{"internalType": "string", "name": "name_", "type": "string"}, {
      "internalType": "string",
      "name": "symbol_",
      "type": "string"
    }, {
      "internalType": "contract Controller",
      "name": "_controller",
      "type": "address"
    }, {"internalType": "bool", "name": "_isUsd", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {
      "indexed": true,
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }, {
      "indexed": false,
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }],
    "name": "Approval",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}],
    "name": "Paused",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "indexed": true,
      "internalType": "bytes32",
      "name": "previousAdminRole",
      "type": "bytes32"
    }, {
      "indexed": true,
      "internalType": "bytes32",
      "name": "newAdminRole",
      "type": "bytes32"
    }],
    "name": "RoleAdminChanged",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "indexed": true,
      "internalType": "address",
      "name": "account",
      "type": "address"
    }, {
      "indexed": true,
      "internalType": "address",
      "name": "sender",
      "type": "address"
    }],
    "name": "RoleGranted",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "indexed": true,
      "internalType": "address",
      "name": "account",
      "type": "address"
    }, {
      "indexed": true,
      "internalType": "address",
      "name": "sender",
      "type": "address"
    }],
    "name": "RoleRevoked",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {
      "indexed": true,
      "internalType": "address",
      "name": "to",
      "type": "address"
    }, {
      "indexed": false,
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }],
    "name": "Transfer",
    "type": "event"
  }, {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "address", "name": "account", "type": "address"}],
    "name": "Unpaused",
    "type": "event"
  }, {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "MINTER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "PAUSER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }],
    "name": "borrowDecrease",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }],
    "name": "borrowIncrease",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "address",
      "name": "account",
      "type": "address"
    }, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "burnFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }],
    "name": "controllerBurn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "address",
      "name": "spender",
      "type": "address"
    }, {"internalType": "uint256", "name": "subtractedValue", "type": "uint256"}],
    "name": "decreaseAllowance",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getBalanceUsd",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getBorrow",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getBorrowUsd",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "getCollateralFactor",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getCollateralUsd",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "getLastPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
    "name": "getRoleAdmin",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "uint256",
      "name": "index",
      "type": "uint256"
    }],
    "name": "getRoleMember",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
    "name": "getRoleMemberCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {
      "internalType": "uint256",
      "name": "addedValue",
      "type": "uint256"
    }],
    "name": "increaseAllowance",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "isCollateral",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "isUSD",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "liquidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "address",
      "name": "to",
      "type": "address"
    }, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    }, {"internalType": "address", "name": "account", "type": "address"}],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "uint256", "name": "_collateralFactor", "type": "uint256"}],
    "name": "setCollateralFactor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "uint256",
      "name": "tokens",
      "type": "uint256"
    }, {"internalType": "uint256", "name": "usd", "type": "uint256"}],
    "name": "setLastPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
    "name": "supportsInterface",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "toUsd",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [],
    "name": "toggleCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }, {
    "inputs": [{
      "internalType": "address",
      "name": "recipient",
      "type": "address"
    }, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {
    "inputs": [{"internalType": "address", "name": "sender", "type": "address"}, {
      "internalType": "address",
      "name": "recipient",
      "type": "address"
    }, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }, {"inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
];

export interface ContractInfo {
  address: string;
  APY: number;
  instance: any;
  availableToken: number,
  mintFee: number
}

export interface ContractDetails {
  distributionApy: number;
  supplyApy: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  private contracts: { [key: string]: ContractInfo } = {};
  private inContracts: { [key: string]: Observable<ContractInfo> } = {};
  private _walletAddress;

  private contractsObservable: Observable<any>;

  constructor(private eth: EthereumService, private api: ApiService) {
  }

  getContract(contractName): Observable<ContractInfo> {
    return this.loadContracts().pipe(
      map(resp => {
        if (this.contracts[contractName] === undefined) {
          throw "Unknown contracts"
        }
        return this.contracts[contractName]
      })
    )
  }

  getTokenNames() {
    return this.loadContracts().pipe(
      map(
        () => {
          return Object.keys(this.contracts).filter(c => !["CONTROLLER", "inToken"].includes(c));
        }
      )
    )
  }

  getAPYs(): Observable<{ [key: string]: number }> {
    // return this.loadContracts().pipe(
    //   map(() => {
    //     return _.mapValues(_.pickBy(this.contracts, (v, k) => k !== "CONTROLLER"), "APY");
    //   })
    // )
    return this.checkWalletAddress()
      .pipe(
        switchMap(address => {
          return this.api.post('reward/apy', {
            sender: address
          })
            .pipe(
              map((resp: any) => {
                return resp.data;
              })
            )
        })
      )
  }

  private loadContracts(): Observable<any> {
    if (!this.contractsObservable) {
      this.contractsObservable = this.api.post("token/info").pipe(
        tap((resp: any) => {
          Object.entries(resp).forEach(([name, address]) => {
            const controllerAddress = (address as any).address as string;
            if (name.toLowerCase() !== 'bnb' && name.toLowerCase() !== 'chip') {
              this.contracts[name] = {
                address: controllerAddress,
                instance: new ethers.Contract(controllerAddress, name === 'CONTROLLER' ? (address as any).abi : ERC20Abi, this.eth.signer),
                APY: (address as any).APY,
                availableToken: null,
                mintFee: null
              }
            } else if (name.toLowerCase() === 'chip') {
              this.contracts[name] = {
                address: controllerAddress,
                instance: new ethers.Contract(controllerAddress, name === 'CONTROLLER' ? (address as any).abi : ERC20Abi, this.eth.signer),
                APY: (address as any).APY,
                availableToken: (address as any).availableToken,
                mintFee: (address as any).mintFee
              }
            } else {
              this.contracts[name] = {
                address: null,
                instance: null,
                APY: (address as any).APY,
                availableToken: null,
                mintFee: null
              }
            }
          });
        }),
        shareReplay()
      );
    }
    return this.contractsObservable;
  }

  getCreditLimitInfo(data) {
    return this.api.post('token/borrow/info', data)
  }

  getContractDetailInfo(tokenName): Observable<ContractDetails> {
    return this.api.post('token/details/info', {tokenName: tokenName}).pipe(map((resp: any) => {
      return resp.data;
    }));
  }

  getCreditPortfolioInfo(walletAddress): Observable<CreditPortfolioInfo> {
    return this.api.post('token/credit/info', {wallet: walletAddress}).pipe(map((resp: any) => {
      return resp.data;
    }))
  }

  getInContract(token): Observable<ContractInfo> {
    if (this.inContracts[token]) {
      return this.inContracts[token];
    }
    return this.inContracts[token] = this.getContract("CONTROLLER").pipe(
      switchMap(controller => {
        if (token.toLowerCase() === "bnb") {
          return fromPromise(controller.instance.inBnbAddress())
        }
        return this.getContract(token).pipe(
          switchMap(c => fromPromise(controller.instance.getInToken(c.address)))
        )
      }),
      map((address: any) => {
        return {
          address,
          APY: null,
          instance: new ethers.Contract(address, collateralAbi, this.eth.signer),
          availableToken: null,
          mintFee: null
        }
      }),
      shareReplay()
    );
  }

  getInContracts(tokens): Observable<ContractInfo[]> {
    return combineLatest<ContractInfo[]>(tokens.map(t => this.getInContract(t)))
  }

  getBorrowSign(wallet, amount): Observable<any> {
    return this.api.post('token/borrow/sign', {
      sender: wallet,
      tokenName: 'CHIP',
      amount: amount
    })
      .pipe(
        map((sign: any) => {
          return sign.data;
        })
      )
  }

  withdrawGameBalanceSign(wallet, amount, tokenName) {
    return this.api.post('balance/withdraw', {
      sender: wallet,
      amount: amount,
      token: tokenName
    })
      .pipe(
        map((sign: any) => {
          return sign.data;
        })
      )
  }

  getMarketInfo() {
    return this.api.post('market/info')
      .pipe(
        map((resp: any) => {
          // return resp.data;
          return {
            ...resp.data,
            totalInpReward: formatUnits(resp.data.totalInpWei),
            totalBnbReward: formatUnits(resp.data.totalBnbWei),
            totalBusdReward: formatUnits(resp.data.totalBusdWei)
          }
        })
      )
  }

  getCollateralConfirmation(amountUsd) {
    return this.checkWalletAddress()
      .pipe(
        switchMap((address) => {
          console.log('address', address);
          return this.api.post('token/collateral/check', {
            wallet: address,
            amountUsd: amountUsd
          })
        })
      )
      .pipe(
        map((resp: any) => {
          return resp.data;
        })
      )
  }

  private checkWalletAddress(): Observable<any> {
    if (!this._walletAddress) {
      return new Observable((observer) => {
        this.eth.signer.getAddress()
          .then(address => {
            this._walletAddress = address;
            observer.next(this._walletAddress);
          })
      });
    } else {
      return new Observable((observer) => {
        observer.next(this._walletAddress);
      });
    }
  }
}
