import { parseAbi } from "viem";

export const swapAbi = parseAbi([
  // views
  "function owner() view returns (address)",
  "function testEthAddress() view returns (address)",
  "function litvmToken() view returns (address)",
  "function staking() view returns (address)",
  "function check_all_deploy_tokens() view returns (address[])",
  "function getRegisteredTokens() view returns (address[])",
  "function contract_to_paird_address(address) view returns (address)",
  "function manualPrice(address) view returns (uint256)",
  "function getPriceByAddress(address paird_address) view returns (int256)",
  "function getSwapQuote(address _fromToken, address _toToken, uint256 _amountIn) view returns (uint256)",
  "function registeredTokens(uint256) view returns (address)",
  // staking facade views
  "function stakedOf(address user) view returns (uint256)",
  "function pendingStakingRewards(address user) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function rewardRatePerSecond() view returns (uint256)",
  "function claimUnlocksIn(address user) view returns (uint256)",
  // LITVM treasury views
  "function litvmBalanceOf(address account) view returns (uint256)",
  "function litvmTotalSupply() view returns (uint256)",
  "function litvmAllowance(address owner, address spender) view returns (uint256)",

  // writes
  "function bridgeToTestEth() payable",
  "function bridgeFromTestEth(uint256 _amount)",
  "function swap(address _fromToken, address _toToken, uint256 _amountIn, uint256 _amountOutMin, uint256 _deadline) returns (uint256)",
  "function createToken(string _name, string _symbol, uint256 _initialMint, uint256 _maxSupply, uint8 _decimals)",
  "function contract_to_paird_addressF(address contract_mint_address, address pairedAddress)",
  "function setTestEthAddress(address _testEthAddress)",
  "function setManualPrice(address token, uint256 price)",
  "function setManualPriceBatch(address[] tokens, uint256[] prices)",
  "function withdrawETH()",
  "function withdrawTokens(address _tokenAddress, uint256 _amount, address _to)",
  "function transferOwnership(address newOwner)",
  "function renounceOwnership()",
  // staking facade writes (v2: stake native zkLTC, earn LITVM)
  "function stakeNative() payable",
  "function unstakeNative(uint256 amount)",
  "function claimStakingRewards() returns (uint256)",
  "function setStakingRewardRate(uint256 rate)",
  "function fundStakingRewards(uint256 amount)",
  "function withdrawStakingRewards(uint256 amount, address to)",
  // LITVM treasury writes
  "function transferLITVM(address to, uint256 amount)",
  "function mintLITVM(address to, uint256 amount)",
  "function pauseLITVM()",
  "function unpauseLITVM()",

  // events
  "event BridgedFromTestEth(address indexed user, uint256 testEthAmount, uint256 nativeAmount)",
  "event BridgedToTestEth(address indexed user, uint256 nativeAmount, uint256 testEthAmount)",
  "event ManualPriceSet(address indexed token, uint256 price)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event PairRegistered(address indexed token, address indexed feed)",
  "event Swapped(address indexed user, address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut)",
  "event TokenCreated(address indexed token, string name, string symbol)"
]);

export const stakingAbi = parseAbi([
  // views
  "function owner() view returns (address)",
  "function stakingToken() view returns (address)",
  "function totalStaked() view returns (uint256)",
  "function rewardRatePerSecond() view returns (uint256)",
  "function rewardPerToken() view returns (uint256)",
  "function pendingRewards(address user) view returns (uint256)",
  "function stakedOf(address user) view returns (uint256)",
  "function lastStakeTime(address user) view returns (uint256)",
  "function claimUnlocksIn(address user) view returns (uint256)",
  "function CLAIM_COOLDOWN() view returns (uint256)",

  // writes
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards() returns (uint256)",
  "function setRewardRatePerSecond(uint256 rate)",
  "function fundRewards() payable",
  "function withdrawNative(uint256 amount, address to)",

  // events
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
  "event RewardRateUpdated(uint256 rate)",
  "event RewardsFunded(address indexed from, uint256 amount)"
]);

export const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function cap() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
