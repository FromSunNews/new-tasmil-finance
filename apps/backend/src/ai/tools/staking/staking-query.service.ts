import { Injectable } from "@nestjs/common";
import { tool } from "ai";
import { ethers } from "ethers";
import { z } from "zod";
import SFC_ABI from "./contracts/sfc.abi.json";

// U2U Solaris Network Configuration
const U2U_SOLARIS_RPC_URL = "https://rpc-mainnet.u2u.xyz";
const SFC_CONTRACT_ADDRESS = "0xfc00face00000000000000000000000000000000";
const GRAPHQL_ENDPOINT = "https://staking-graphql.u2u.xyz/graphql";
const SUBGRAPH_ENDPOINT = "https://graph.u2u.xyz/subgraphs/name/u2u/sfc-subgraph-v3";

interface Validator {
  id: string;
  validatorId: string;
  hash: string;
  auth: string;
  selfStaked: string;
  delegatedAmount: string;
  totalStakedAmount: string;
  createdTime: string;
  createdEpoch: string;
  active: boolean;
  online: boolean;
  downTime: string;
  lockedUntil: string;
  lockDays: number;
  totalClaimedRewards: string;
  totalDelegator: number;
}

interface StakingStats {
  id: string;
  totalStaked: string;
  totalDelegated: string;
  totalSelfStaked: string;
  totalValidator: number;
  totalDelegator: number;
}

/**
 * Create provider for U2U Solaris
 */
function createU2UProvider() {
  return new ethers.JsonRpcProvider(U2U_SOLARIS_RPC_URL);
}

/**
 * Get SFC contract instance
 */
function getSFCContract() {
  const provider = createU2UProvider();
  // Ensure ABI is an array (handle both default export and named export)
  const abi = Array.isArray(SFC_ABI) ? SFC_ABI : (SFC_ABI as any).default || SFC_ABI;
  return new ethers.Contract(SFC_CONTRACT_ADDRESS, abi, provider);
}

@Injectable()
export class StakingQueryService {
  /**
   * Tool 1: Get account U2U balance
   */
  getAccountBalanceTool(walletAddress?: string) {
    return tool({
      description:
        "Get the U2U balance of a wallet address on U2U Solaris network. Use this when users ask about their wallet balance or native U2U token balance.",
      inputSchema: z.object({
        address: z
          .string()
          .optional()
          .describe(
            "Wallet address to check balance. Use 'my-wallet' for connected wallet or leave empty to use connected wallet."
          ),
      }),
      execute: async ({ address }) => {
        try {
          console.log("🔍 getAccountBalance tool called with params:", {
            address,
            walletAddress,
            timestamp: new Date().toISOString(),
          });

          // Handle special case for "my-wallet" or empty address
          let actualAddress = address;
          if (
            !actualAddress ||
            actualAddress === "my-wallet" ||
            actualAddress === "my address" ||
            actualAddress === "my wallet"
          ) {
            if (!walletAddress) {
              return {
                success: false,
                error:
                  "Please connect your wallet first. I cannot access your wallet address.",
              };
            }
            actualAddress = walletAddress;
          }

          console.log("🔍 Getting account balance for:", actualAddress);

          const provider = createU2UProvider();
          const balance = await provider.getBalance(actualAddress);
          const formattedBalance = ethers.formatEther(balance);

          return {
            success: true,
            walletAddress: actualAddress,
            balance: formattedBalance,
            balanceWei: balance.toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 2: Get current epoch
   */
  getCurrentEpochTool() {
    return tool({
      description:
        "Get the current epoch number on U2U Solaris network. Use this when users ask about the current epoch or staking period.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getCurrentEpoch tool called with params:", {
            timestamp: new Date().toISOString(),
          });
          console.log("🔍 Getting current epoch...");

          const contract = getSFCContract();
          const epoch = await contract.currentEpoch();

          return {
            success: true,
            currentEpoch: epoch.toString(),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 3: Get total stake
   */
  getTotalStakeTool() {
    return tool({
      description:
        "Get the total stake in the U2U Solaris network. Use this when users ask about total staked amount or network statistics.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getTotalStake tool called with params:", {
            timestamp: new Date().toISOString(),
          });
          console.log("🔍 Getting total stake...");

          const contract = getSFCContract();
          const totalStake = await contract.totalStake();

          const formattedStake = ethers.formatEther(totalStake);

          return {
            success: true,
            totalStake: formattedStake,
            totalStakeWei: (totalStake as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 4: Get total active stake
   */
  getTotalActiveStakeTool() {
    return tool({
      description:
        "Get the total active stake in the U2U Solaris network. Use this when users ask about active staking or network participation.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getTotalActiveStake tool called with params:", {
            timestamp: new Date().toISOString(),
          });
          console.log("🔍 Getting total active stake...");

          const contract = getSFCContract();
          const totalActiveStake = await contract.totalActiveStake();

          const formattedStake = ethers.formatEther(totalActiveStake);

          return {
            success: true,
            totalActiveStake: formattedStake,
            totalActiveStakeWei: (totalActiveStake as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 5: Get validator ID by auth address
   */
  getValidatorIDTool() {
    return tool({
      description:
        "Get the validator ID associated with an auth address. Use this when users ask about validator information or validator ID lookup.",
      inputSchema: z.object({
        authAddress: z
          .string()
          .describe("Auth address of the validator to look up"),
      }),
      execute: async ({ authAddress }) => {
        try {
          console.log("🔍 getValidatorID tool called with params:", {
            authAddress,
            timestamp: new Date().toISOString(),
          });
          console.log("🔍 Getting validator ID for:", authAddress);

          const contract = getSFCContract();
          const validatorID = await contract.getValidatorID(authAddress);

          return {
            success: true,
            authAddress,
            validatorID: (validatorID as bigint).toString(),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 6: Get validator information
   */
  getValidatorInfoTool() {
    return tool({
      description:
        "Get detailed information about a validator including status, creation time, and auth address. Use this when users ask about validator details.",
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to query (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ validatorID }) => {
        try {
          console.log("🔍 getValidatorInfo tool called with params:", {
            validatorID,
            timestamp: new Date().toISOString(),
          });

          // Validate validatorID
          if (!validatorID || validatorID.trim() === "") {
            return {
              success: false,
              error: "Validator ID is required",
            };
          }

          // Ensure validatorID is a valid number
          const validatorIdNum = Number.parseInt(validatorID, 10);
          if (Number.isNaN(validatorIdNum) || validatorIdNum <= 0) {
            return {
              success: false,
              error:
                "Invalid validator ID. Please provide a valid positive number.",
            };
          }

          console.log("🔍 Getting validator info for ID:", validatorID);

          const contract = getSFCContract();
          const validator = await contract.getValidator(BigInt(validatorID));

          const validatorData = validator as any[];

          console.log("Validator Data:", validatorData);

          // Validate response data
          if (!validatorData || validatorData.length < 6) {
            return {
              success: false,
              error: "Invalid validator data received from contract",
            };
          }

          return {
            success: true,
            validatorID,
            status: validatorData[0].toString(),
            createdEpoch: validatorData[1].toString(),
            createdTime: validatorData[2].toString(),
            deactivatedTime: validatorData[3].toString(),
            deactivatedEpoch: validatorData[4].toString(),
            auth: validatorData[5],
          };
        } catch (error) {
          console.error("Error in getValidatorInfo:", error);

          // Return a more specific error message
          let errorMessage = "Unknown error occurred";

          if (error instanceof Error) {
            if (error.message.includes("execution reverted")) {
              errorMessage = "Validator not found or invalid validator ID";
            } else if (error.message.includes("network")) {
              errorMessage = "Network error. Please try again later";
            } else {
              errorMessage = error.message;
            }
          }

          return {
            success: false,
            error: errorMessage,
          };
        }
      },
    });
  }

  /**
   * Tool 7: Get self stake of a validator
   */
  getSelfStakeTool() {
    return tool({
      description:
        "Get the self-stake amount of a validator (amount staked by validator itself). Use this when users ask about validator's own stake.",
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to query (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ validatorID }) => {
        try {
          console.log("🔍 getSelfStake tool called with params:", {
            validatorID,
            timestamp: new Date().toISOString(),
          });
          console.log("🔍 Getting self stake for validator:", validatorID);

          const contract = getSFCContract();
          const selfStake = await contract.getSelfStake(BigInt(validatorID));

          const formattedStake = ethers.formatEther(selfStake);
          console.log("Formatted Stake:", formattedStake);

          return {
            success: true,
            validatorID,
            selfStake: formattedStake,
            selfStakeWei: (selfStake as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          console.log("Error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 8: Get delegated stake
   */
  getStakeTool(walletAddress?: string) {
    return tool({
      description:
        "Get the amount staked by a delegator to a specific validator. Use this when users ask about their staking amount or delegation to a validator.",
      inputSchema: z.object({
        delegatorID: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet address or leave empty to use connected wallet."
          ),
        validatorID: z
          .string()
          .describe("Validator ID (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ delegatorID, validatorID }) => {
        try {
          console.log("🔍 getStake tool called with params:", {
            delegatorID,
            validatorID,
            walletAddress,
            timestamp: new Date().toISOString(),
          });

          // Handle special case for "my-wallet" or empty delegatorID
          let actualDelegatorID = delegatorID;
          if (
            !actualDelegatorID ||
            actualDelegatorID === "my-wallet" ||
            actualDelegatorID === "my address" ||
            actualDelegatorID === "my wallet"
          ) {
            if (!walletAddress) {
              return {
                success: false,
                error:
                  "Please connect your wallet first. I cannot access your wallet address.",
              };
            }
            actualDelegatorID = walletAddress;
          }

          console.log(
            "🔍 Getting stake for delegator:",
            actualDelegatorID,
            "validator:",
            validatorID
          );

          const contract = getSFCContract();
          const stake = await contract.getStake(
            actualDelegatorID,
            BigInt(validatorID)
          );

          const formattedStake = ethers.formatEther(stake);

          return {
            success: true,
            delegatorID: actualDelegatorID,
            validatorID,
            stake: formattedStake,
            stakeWei: (stake as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 9: Get unlocked stake
   */
  getUnlockedStakeTool(walletAddress?: string) {
    return tool({
      description:
        "Get the unlocked stake amount for a delegator. Use this when users ask about their unlocked or available stake that can be withdrawn.",
      inputSchema: z.object({
        delegatorID: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet address or leave empty to use connected wallet."
          ),
        validatorID: z
          .string()
          .describe("Validator ID (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ delegatorID, validatorID }) => {
        try {
          console.log("🔍 getUnlockedStake tool called with params:", {
            delegatorID,
            validatorID,
            walletAddress,
            timestamp: new Date().toISOString(),
          });

          // Handle special case for "my-wallet" or empty delegatorID
          let actualDelegatorID = delegatorID;
          if (
            !actualDelegatorID ||
            actualDelegatorID === "my-wallet" ||
            actualDelegatorID === "my address" ||
            actualDelegatorID === "my wallet"
          ) {
            if (!walletAddress) {
              return {
                success: false,
                error:
                  "Please connect your wallet first. I cannot access your wallet address.",
              };
            }
            actualDelegatorID = walletAddress;
          }

          console.log(
            "🔍 Getting unlocked stake for delegator:",
            actualDelegatorID,
            "validator:",
            validatorID
          );

          const contract = getSFCContract();
          const unlockedStake = await contract.getUnlockedStake(
            actualDelegatorID,
            BigInt(validatorID)
          );

          const formattedStake = ethers.formatEther(unlockedStake);

          return {
            success: true,
            delegatorID: actualDelegatorID,
            validatorID,
            unlockedStake: formattedStake,
            unlockedStakeWei: (unlockedStake as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 10: Get pending rewards
   */
  getPendingRewardsTool(walletAddress?: string) {
    return tool({
      description:
        "Get the pending rewards for a delegator from a validator. Use this when users ask about their unclaimed rewards or pending earnings.",
      inputSchema: z.object({
        delegatorID: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet address or leave empty to use connected wallet."
          ),
        validatorID: z
          .string()
          .describe("Validator ID (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ delegatorID, validatorID }) => {
        try {
          console.log("🔍 getPendingRewards tool called with params:", {
            delegatorID,
            validatorID,
            walletAddress,
            timestamp: new Date().toISOString(),
          });

          // Handle special case for "my-wallet" or empty delegatorID
          let actualDelegatorID = delegatorID;
          if (
            !actualDelegatorID ||
            actualDelegatorID === "my-wallet" ||
            actualDelegatorID === "my address" ||
            actualDelegatorID === "my wallet"
          ) {
            if (!walletAddress) {
              return {
                success: false,
                error:
                  "Please connect your wallet first. I cannot access your wallet address.",
              };
            }
            actualDelegatorID = walletAddress;
          }

          console.log(
            "🔍 Getting pending rewards for delegator:",
            actualDelegatorID,
            "validator:",
            validatorID
          );

          const contract = getSFCContract();
          const rewards = await contract.pendingRewards(
            actualDelegatorID,
            BigInt(validatorID)
          );

          const formattedRewards = ethers.formatEther(rewards);

          return {
            success: true,
            delegatorID: actualDelegatorID,
            validatorID,
            pendingRewards: formattedRewards,
            pendingRewardsWei: (rewards as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 11: Get stashed rewards
   */
  getRewardsStashTool(walletAddress?: string) {
    return tool({
      description:
        "Get the stashed rewards for a delegator. Use this when users ask about their stored or accumulated rewards.",
      inputSchema: z.object({
        delegatorID: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet address or leave empty to use connected wallet."
          ),
        validatorID: z
          .string()
          .describe("Validator ID (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ delegatorID, validatorID }) => {
        try {
          console.log("🔍 getRewardsStash tool called with params:", {
            delegatorID,
            validatorID,
            walletAddress,
            timestamp: new Date().toISOString(),
          });

          // Handle special case for "my-wallet" or empty delegatorID
          let actualDelegatorID = delegatorID;
          if (
            !actualDelegatorID ||
            actualDelegatorID === "my-wallet" ||
            actualDelegatorID === "my address" ||
            actualDelegatorID === "my wallet"
          ) {
            if (!walletAddress) {
              return {
                success: false,
                error:
                  "Please connect your wallet first. I cannot access your wallet address.",
              };
            }
            actualDelegatorID = walletAddress;
          }

          console.log(
            "🔍 Getting rewards stash for delegator:",
            actualDelegatorID,
            "validator:",
            validatorID
          );

          const contract = getSFCContract();
          const stash = await contract.rewardsStash(
            actualDelegatorID,
            BigInt(validatorID)
          );

          const formattedStash = ethers.formatEther(stash);

          return {
            success: true,
            delegatorID: actualDelegatorID,
            validatorID,
            rewardsStash: formattedStash,
            rewardsStashWei: (stash as bigint).toString(),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 12: Get lockup information
   */
  getLockupInfoTool(walletAddress?: string) {
    return tool({
      description:
        "Get the lockup information for a delegator including locked amount, start epoch, end time, and duration. Use this when users ask about their locked stake or lockup details.",
      inputSchema: z.object({
        delegatorID: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet address or leave empty to use connected wallet."
          ),
        validatorID: z
          .string()
          .describe("Validator ID (as string, e.g., '1', '2', etc.)"),
      }),
      execute: async ({ delegatorID, validatorID }) => {
        try {
          console.log("🔍 getLockupInfo tool called with params:", {
            delegatorID,
            validatorID,
            walletAddress,
            timestamp: new Date().toISOString(),
          });

          // Handle special case for "my-wallet" or empty delegatorID
          let actualDelegatorID = delegatorID;
          if (
            !actualDelegatorID ||
            actualDelegatorID === "my-wallet" ||
            actualDelegatorID === "my address" ||
            actualDelegatorID === "my wallet"
          ) {
            if (!walletAddress) {
              return {
                success: false,
                error:
                  "Please connect your wallet first. I cannot access your wallet address.",
              };
            }
            actualDelegatorID = walletAddress;
          }

          console.log(
            "🔍 Getting lockup info for delegator:",
            actualDelegatorID,
            "validator:",
            validatorID
          );

          const contract = getSFCContract();
          const lockupInfo = await contract.getLockupInfo(
            actualDelegatorID,
            BigInt(validatorID)
          );

          const lockupData = lockupInfo as any[];
          const lockedStake = ethers.formatEther(lockupData[0]);
          const fromEpoch = (lockupData[1] as bigint).toString();
          const endTime = (lockupData[2] as bigint).toString();
          const duration = (lockupData[3] as bigint).toString();

          // Calculate end date
          const endDate = new Date(Number(endTime) * 1000);
          const durationDays = Number(duration) / 86_400;

          return {
            success: true,
            delegatorID: actualDelegatorID,
            validatorID,
            lockedStake,
            lockedStakeWei: (lockupData[0] as bigint).toString(),
            fromEpoch,
            endTime,
            endDate: endDate.toISOString(),
            duration,
            durationDays: durationDays.toFixed(2),
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 13: Get staking APR for validator and amount
   */
  getStakingAPRTool() {
    return tool({
      description:
        "Get the staking APR (Annual Percentage Rate) for a specific validator and staking amount. Use this when users ask about staking rewards or APR.",
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe(
            "Validator ID to get APR for (as string, e.g., '1', '2', etc.)"
          ),
        amount: z.string().describe("Staking amount in U2U (e.g., '100', '1000')"),
      }),
      execute: async ({ validatorID, amount }) => {
        try {
          console.log("🔍 getStakingAPR tool called with params:", {
            validatorID,
            amount,
            timestamp: new Date().toISOString(),
          });

          const response = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operationName: "stakingApr",
              query: `
                query stakingApr($validatorId: Int!, $stakingAmount: String!) {
                  apr0: calculateApr(
                    validatorId: $validatorId
                    amount: $stakingAmount
                    duration: 0
                  )
                }
              `,
              variables: {
                validatorId: Number.parseInt(validatorID, 10),
                stakingAmount: ethers.parseUnits(amount, 18).toString(),
              },
            }),
          });

          const data: any = await response.json();
          console.log("Data:", data);

          // Check error from GraphQL
          if (data.errors) {
            console.error("GraphQL Errors:", data.errors);
            return {
              success: false,
              error: `GraphQL Error: ${data.errors[0]?.message || "Unknown error"}`,
            };
          }

          const apr = data.data.apr0;

          console.log("APR:", apr);

          return {
            success: true,
            validatorID,
            amount,
            apr,
            aprFormatted: `${apr}%`,
            unit: "U2U",
          };
        } catch (error) {
          console.log("error", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Tool 14: Get validators information
   */
  getValidatorsInfoTool() {
    return tool({
      description:
        "Get comprehensive information about all validators including staking amounts, delegations, and status. Use this when users ask about validator list or validator comparison.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getValidatorsInfo tool called with params:", {
            timestamp: new Date().toISOString(),
          });

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30 second timeout

          const response = await fetch(SUBGRAPH_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              operationName: "Validators",
              query: `
                query Validators {
                  validators {
                    id
                    validatorId
                    hash
                    auth
                    selfStaked
                    delegatedAmount
                    totalStakedAmount
                    createdTime
                    createdEpoch
                    active
                    online
                    downTime
                    lockedUntil
                    lockDays
                    totalClaimedRewards
                    totalDelegator
                    __typename
                  }
                }
              `,
              variables: {},
            }),
          });

          clearTimeout(timeoutId);

          // Check if response is ok
          if (!response.ok) {
            return {
              success: false,
              error: `HTTP Error: ${response.status} ${response.statusText}`,
            };
          }

          const data: any = await response.json();

          // Check error from GraphQL
          if (data.errors) {
            console.error("GraphQL Errors:", data.errors);
            return {
              success: false,
              error: `GraphQL Error: ${data.errors[0]?.message || "Unknown error"}`,
            };
          }

          // Check if data exists
          if (!data.data || !data.data.validators) {
            return {
              success: false,
              error: "No validators data received from GraphQL",
            };
          }

          const validators: Validator[] = data.data.validators;

          return {
            success: true,
            validators: validators.map((validator) => ({
              ...validator,
              selfStakedFormatted: ethers.formatEther(validator.selfStaked),
              delegatedAmountFormatted: ethers.formatEther(
                validator.delegatedAmount
              ),
              totalStakedAmountFormatted: ethers.formatEther(
                validator.totalStakedAmount
              ),
              totalClaimedRewardsFormatted: ethers.formatEther(
                validator.totalClaimedRewards
              ),
            })),
            totalValidators: validators.length,
            unit: "U2U",
          };
        } catch (error) {
          console.error("Error in getValidatorsInfo:", error);

          let errorMessage = "Unknown error occurred";

          if (error instanceof Error) {
            if (error.name === "AbortError") {
              errorMessage = "Request timeout. Please try again later.";
            } else if (error.message.includes("fetch")) {
              errorMessage = "Network error. Please check your connection.";
            } else {
              errorMessage = error.message;
            }
          }

          return {
            success: false,
            error: errorMessage,
          };
        }
      },
    });
  }

  /**
   * Tool 15: Get staking statistics
   */
  getStakingStatsTool() {
    return tool({
      description:
        "Get overall staking statistics including total staked, delegated amounts, and validator/delegator counts. Use this when users ask about network staking overview or statistics.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log("🔍 getStakingStats tool called with params:", {
            timestamp: new Date().toISOString(),
          });

          const response = await fetch(SUBGRAPH_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operationName: "StakingStats",
              query: `
                query StakingStats {
                  stakings {
                    id
                    totalStaked
                    totalDelegated
                    totalSelfStaked
                    totalValidator
                    totalDelegator
                    __typename
                  }
                }
              `,
              variables: {},
            }),
          });

          const data: any = await response.json();

          // Check error from GraphQL
          if (data.errors) {
            console.error("GraphQL Errors:", data.errors);
            return {
              success: false,
              error: `GraphQL Error: ${data.errors[0]?.message || "Unknown error"}`,
            };
          }

          const stakingStats: StakingStats[] = data.data.stakings;
          const stats = stakingStats[0]; // Usually there's only one stats object

          return {
            success: true,
            totalStaked: ethers.formatEther(stats.totalStaked),
            totalDelegated: ethers.formatEther(stats.totalDelegated),
            totalSelfStaked: ethers.formatEther(stats.totalSelfStaked),
            totalValidator: stats.totalValidator,
            totalDelegator: stats.totalDelegator,
            totalStakedWei: stats.totalStaked,
            totalDelegatedWei: stats.totalDelegated,
            totalSelfStakedWei: stats.totalSelfStaked,
            unit: "U2U",
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });
  }

  /**
   * Get all tools for staking agent
   */
  getAllTools(walletAddress?: string) {
    return {
      getAccountBalance: this.getAccountBalanceTool(walletAddress),
      getCurrentEpoch: this.getCurrentEpochTool(),
      getTotalStake: this.getTotalStakeTool(),
      getTotalActiveStake: this.getTotalActiveStakeTool(),
      getValidatorID: this.getValidatorIDTool(),
      getValidatorInfo: this.getValidatorInfoTool(),
      getSelfStake: this.getSelfStakeTool(),
      getStake: this.getStakeTool(walletAddress),
      getUnlockedStake: this.getUnlockedStakeTool(walletAddress),
      getPendingRewards: this.getPendingRewardsTool(walletAddress),
      getRewardsStash: this.getRewardsStashTool(walletAddress),
      getLockupInfo: this.getLockupInfoTool(walletAddress),
      getStakingAPR: this.getStakingAPRTool(),
      getValidatorsInfo: this.getValidatorsInfoTool(),
      getStakingStats: this.getStakingStatsTool(),
    };
  }
}

