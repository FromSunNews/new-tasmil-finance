import { Injectable } from "@nestjs/common";
import { tool } from "ai";
import { z } from "zod";

@Injectable()
export class StakingOperationsService {
  /**
   * Tool: Delegate/Stake U2U tokens to a validator
   */
  delegateStakeTool() {
    return tool({
      description:
        "Delegate (stake) U2U tokens to a validator. Use this when users want to stake their U2U tokens to earn rewards.",
      needsApproval: true,
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to delegate to (e.g., '1', '2', '3')"),
        amount: z
          .string()
          .describe("Amount of U2U tokens to stake (e.g., '100.0', '50.5')"),
        delegatorAddress: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet or leave empty for connected wallet."
          ),
      }),
      execute: ({ validatorID, amount, delegatorAddress }) => {
        try {
          console.log("🔍 delegateStake tool called with params:", {
            validatorID,
            amount,
            delegatorAddress,
            timestamp: new Date().toISOString(),
          });

          // Validate inputs
          const validatorIdNum = Number.parseInt(validatorID);
          if (Number.isNaN(validatorIdNum) || validatorIdNum <= 0) {
            return {
              success: false,
              error:
                "Invalid validator ID. Please provide a valid validator ID (e.g., '1', '2', '3').",
            };
          }

          const amountNum = Number.parseFloat(amount);
          if (Number.isNaN(amountNum) || amountNum <= 0) {
            return {
              success: false,
              error:
                "Invalid amount. Please provide a valid amount greater than 0.",
            };
          }

          // Return staking request data for UI
          return {
            success: true,
            action: "delegate",
            validatorID: validatorIdNum,
            amount: amountNum,
            amountFormatted: `${amount} U2U`,
            delegatorAddress: delegatorAddress || "my-wallet",
            message: `Ready to stake ${amount} U2U to validator ${validatorID}`,
            requiresWallet: true,
            requiresConfirmation: true,
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
   * Tool: Undelegate/Unstake U2U tokens from a validator
   */
  undelegateStakeTool() {
    return tool({
      description:
        "Undelegate (unstake) U2U tokens from a validator. Use this when users want to unstake their tokens.",
      needsApproval: true,
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to undelegate from (e.g., '1', '2', '3')"),
        amount: z
          .string()
          .describe("Amount of U2U tokens to unstake (e.g., '100.0', '50.5')"),
        wrID: z
          .string()
          .optional()
          .describe(
            "Withdrawal Request ID (optional, will generate if not provided)"
          ),
        delegatorAddress: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet or leave empty for connected wallet."
          ),
      }),
      execute: ({ validatorID, amount, wrID, delegatorAddress }) => {
        try {
          console.log("🔍 undelegateStake tool called with params:", {
            validatorID,
            amount,
            wrID,
            delegatorAddress,
            timestamp: new Date().toISOString(),
          });

          // Validate inputs
          const validatorIdNum = Number.parseInt(validatorID);
          if (Number.isNaN(validatorIdNum) || validatorIdNum <= 0) {
            return {
              success: false,
              error:
                "Invalid validator ID. Please provide a valid validator ID (e.g., '1', '2', '3').",
            };
          }

          const amountNum = Number.parseFloat(amount);
          if (Number.isNaN(amountNum) || amountNum <= 0) {
            return {
              success: false,
              error:
                "Invalid amount. Please provide a valid amount greater than 0.",
            };
          }

          // Generate wrID if not provided
          const withdrawalRequestID = wrID
            ? Number.parseInt(wrID)
            : Math.floor(Math.random() * 1_000_000);

          return {
            success: true,
            action: "undelegate",
            validatorID: validatorIdNum,
            amount: amountNum,
            amountFormatted: `${amount} U2U`,
            wrID: withdrawalRequestID,
            delegatorAddress: delegatorAddress || "my-wallet",
            message: `Ready to unstake ${amount} U2U from validator ${validatorID}`,
            requiresWallet: true,
            requiresConfirmation: true,
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
   * Tool: Claim rewards from a validator
   */
  claimRewardsTool() {
    return tool({
      description:
        "Claim pending rewards from a validator. Use this when users want to claim their earned rewards.",
      needsApproval: true,
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to claim rewards from (e.g., '1', '2', '3')"),
        delegatorAddress: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet or leave empty for connected wallet."
          ),
      }),
      execute: ({ validatorID, delegatorAddress }) => {
        try {
          console.log("🔍 claimRewards tool called with params:", {
            validatorID,
            delegatorAddress,
            timestamp: new Date().toISOString(),
          });

          // Validate inputs
          const validatorIdNum = Number.parseInt(validatorID);
          if (Number.isNaN(validatorIdNum) || validatorIdNum <= 0) {
            return {
              success: false,
              error:
                "Invalid validator ID. Please provide a valid validator ID (e.g., '1', '2', '3').",
            };
          }

          return {
            success: true,
            action: "claimRewards",
            validatorID: validatorIdNum,
            delegatorAddress: delegatorAddress || "my-wallet",
            message: `Ready to claim rewards from validator ${validatorID}`,
            requiresWallet: true,
            requiresConfirmation: true,
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
   * Tool: Restake rewards (compound)
   */
  restakeRewardsTool() {
    return tool({
      description:
        "Restake (compound) rewards from a validator. Use this when users want to compound their rewards back into staking.",
      needsApproval: true,
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to restake rewards for (e.g., '1', '2', '3')"),
        delegatorAddress: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet or leave empty for connected wallet."
          ),
      }),
      execute: ({ validatorID, delegatorAddress }) => {
        try {
          console.log("🔍 restakeRewards tool called with params:", {
            validatorID,
            delegatorAddress,
            timestamp: new Date().toISOString(),
          });

          // Validate inputs
          const validatorIdNum = Number.parseInt(validatorID);
          if (Number.isNaN(validatorIdNum) || validatorIdNum <= 0) {
            return {
              success: false,
              error:
                "Invalid validator ID. Please provide a valid validator ID (e.g., '1', '2', '3').",
            };
          }

          return {
            success: true,
            action: "restakeRewards",
            validatorID: validatorIdNum,
            delegatorAddress: delegatorAddress || "my-wallet",
            message: `Ready to restake rewards for validator ${validatorID}`,
            requiresWallet: true,
            requiresConfirmation: true,
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
   * Tool: Lock stake for additional rewards
   */
  lockStakeTool() {
    return tool({
      description:
        "Lock stake for additional rewards. Use this when users want to lock their stake for bonus rewards.",
      needsApproval: true,
      inputSchema: z.object({
        validatorID: z
          .string()
          .describe("Validator ID to lock stake for (e.g., '1', '2', '3')"),
        amount: z
          .string()
          .describe("Amount of U2U tokens to lock (e.g., '100.0', '50.5')"),
        lockupDuration: z
          .string()
          .describe("Lockup duration in days (e.g., '7', '14', '30')"),
        delegatorAddress: z
          .string()
          .optional()
          .describe(
            "Delegator address. Use 'my-wallet' for connected wallet or leave empty for connected wallet."
          ),
      }),
      execute: ({ validatorID, amount, lockupDuration, delegatorAddress }) => {
        try {
          console.log("🔍 lockStake tool called with params:", {
            validatorID,
            amount,
            lockupDuration,
            delegatorAddress,
            timestamp: new Date().toISOString(),
          });

          // Validate inputs
          const validatorIdNum = Number.parseInt(validatorID);
          if (Number.isNaN(validatorIdNum) || validatorIdNum <= 0) {
            return {
              success: false,
              error:
                "Invalid validator ID. Please provide a valid validator ID (e.g., '1', '2', '3').",
            };
          }

          const amountNum = Number.parseFloat(amount);
          if (Number.isNaN(amountNum) || amountNum <= 0) {
            return {
              success: false,
              error:
                "Invalid amount. Please provide a valid amount greater than 0.",
            };
          }

          const durationDays = Number.parseInt(lockupDuration);
          if (Number.isNaN(durationDays) || durationDays <= 0) {
            return {
              success: false,
              error:
                "Invalid lockup duration. Please provide a valid duration in days (e.g., '7', '14', '30').",
            };
          }

          const durationSeconds = durationDays * 24 * 60 * 60; // Convert days to seconds

          return {
            success: true,
            action: "lockStake",
            validatorID: validatorIdNum,
            amount: amountNum,
            amountFormatted: `${amount} U2U`,
            lockupDuration: durationSeconds,
            lockupDurationDays: durationDays,
            delegatorAddress: delegatorAddress || "my-wallet",
            message: `Ready to lock ${amount} U2U for ${durationDays} days on validator ${validatorID}`,
            requiresWallet: true,
            requiresConfirmation: true,
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
   * Get all operation tools
   */
  getAllTools() {
    return {
      delegateStake: this.delegateStakeTool(),
      undelegateStake: this.undelegateStakeTool(),
      claimRewards: this.claimRewardsTool(),
      restakeRewards: this.restakeRewardsTool(),
      lockStake: this.lockStakeTool(),
    };
  }
}

