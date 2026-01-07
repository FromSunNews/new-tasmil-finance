"use client";

import { Wallet, Clock, TrendingUp, Users, AlertCircle, DollarSign, Coins } from "lucide-react";

interface StakingResultProps {
  result: any;
  toolType: string;
}

const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  const numValue = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(numValue)) return "N/A";
  if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(2)}B`;
  if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(2)}M`;
  if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(2)}K`;
  return numValue.toFixed(4);
};

// Helper to extract formatted value from stake/pendingRewards object
const getFormattedValue = (data: any, key: string): string => {
  const value = data[key];
  if (!value) return "N/A";
  
  // If it's an object with formatted property (new format)
  if (typeof value === "object" && value.formatted) {
    return value.formatted;
  }
  
  // If it's a direct number/string (old format)
  return formatNumber(value);
};

const UserStakeResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Coins className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Staked Amount</h3>
        <p className="text-muted-foreground text-sm">Your delegation to validator</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID || "N/A"}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Delegator</span>
        <span className="font-mono text-xs" title={data.delegatorAddress}>
          {data.delegatorAddress ? `${data.delegatorAddress.slice(0, 6)}...${data.delegatorAddress.slice(-4)}` : "N/A"}
        </span>
      </div>
      <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-center">
        <div className="text-muted-foreground text-xs mb-1">Total Staked</div>
        <div className="text-xl font-bold text-primary">
          {getFormattedValue(data, "stake")}
        </div>
      </div>
    </div>
  </div>
);

const PendingRewardsResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
        <DollarSign className="h-5 w-5 text-green-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Pending Rewards</h3>
        <p className="text-muted-foreground text-sm">Unclaimed staking rewards</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID || "N/A"}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Delegator</span>
        <span className="font-mono text-xs" title={data.delegatorAddress}>
          {data.delegatorAddress ? `${data.delegatorAddress.slice(0, 6)}...${data.delegatorAddress.slice(-4)}` : "N/A"}
        </span>
      </div>
      <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-center">
        <div className="text-muted-foreground text-xs mb-1">Unclaimed Rewards</div>
        <div className="text-xl font-bold text-green-500">
          {getFormattedValue(data, "pendingRewards")}
        </div>
      </div>
    </div>
  </div>
);

const AccountBalanceResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Wallet className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Account Balance</h3>
        <p className="text-muted-foreground text-sm">Wallet balance</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Address</span>
        <span className="font-mono text-xs">{data.walletAddress || data.delegatorAddress || "N/A"}</span>
      </div>
      <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-center">
        <div className="text-muted-foreground text-xs mb-1">Balance</div>
        <div className="text-xl font-bold text-primary">
          {data.balance?.formatted || formatNumber(data.balance) || getFormattedValue(data, "stake")}
          {data.unit && <span className="text-muted-foreground text-sm ml-1">{data.unit}</span>}
        </div>
      </div>
    </div>
  </div>
);

const CurrentEpochResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Clock className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Current Epoch</h3>
        <p className="text-muted-foreground text-sm">Network epoch info</p>
      </div>
    </div>
    <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-center">
      <div className="text-muted-foreground text-xs mb-1">Epoch Number</div>
      <div className="text-2xl font-bold text-primary">{data.currentEpoch}</div>
    </div>
  </div>
);

const TotalStakeResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Total Stake</h3>
        <p className="text-muted-foreground text-sm">Network total staked</p>
      </div>
    </div>
    <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-center">
      <div className="text-muted-foreground text-xs mb-1">Total Staked Amount</div>
      <div className="text-xl font-bold text-primary">
        {data.totalStake?.formatted || formatNumber(data.totalStake)}
        {data.unit && <span className="text-muted-foreground text-sm ml-1">{data.unit}</span>}
      </div>
    </div>
  </div>
);

const ValidatorInfoResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Validator Info</h3>
        <p className="text-muted-foreground text-sm">Validator details</p>
      </div>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Status</span>
        <span className="font-medium">{data.status}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Created Epoch</span>
        <span className="font-medium">{data.createdEpoch}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Auth Address</span>
        <span className="font-mono text-xs">{data.auth}</span>
      </div>
    </div>
  </div>
);

const UnlockedStakeResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Wallet className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Unlocked Stake</h3>
        <p className="text-muted-foreground text-sm">Available to withdraw</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID || "N/A"}</span>
      </div>
      <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-center">
        <div className="text-muted-foreground text-xs mb-1">Unlocked Amount</div>
        <div className="text-xl font-bold text-primary">
          {getFormattedValue(data, "unlockedStake") || getFormattedValue(data, "stake")}
        </div>
      </div>
    </div>
  </div>
);

const LockupInfoResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
        <Clock className="h-5 w-5 text-orange-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Lockup Info</h3>
        <p className="text-muted-foreground text-sm">Stake lock details</p>
      </div>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID || "N/A"}</span>
      </div>
      {data.lockedStake && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Locked Stake</span>
          <span className="font-medium">{getFormattedValue(data, "lockedStake")}</span>
        </div>
      )}
      {data.lockupDuration && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{data.lockupDuration}</span>
        </div>
      )}
      {data.endTime && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">End Time</span>
          <span className="font-medium">{data.endTime}</span>
        </div>
      )}
    </div>
  </div>
);

const RewardsStashResult = ({ data }: { data: any }) => (
  <div className="max-w-sm rounded-lg bg-card/40 border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
        <DollarSign className="h-5 w-5 text-green-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Rewards Stash</h3>
        <p className="text-muted-foreground text-sm">Accumulated rewards</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID || "N/A"}</span>
      </div>
      <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-center">
        <div className="text-muted-foreground text-xs mb-1">Stashed Rewards</div>
        <div className="text-xl font-bold text-green-500">
          {getFormattedValue(data, "rewardsStash") || getFormattedValue(data, "pendingRewards")}
        </div>
      </div>
    </div>
  </div>
);

const ErrorResult = ({ error }: { error: string }) => (
  <div className="max-w-sm rounded-lg border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-destructive">Error</h3>
        <p className="text-destructive/80 text-sm">{error}</p>
      </div>
    </div>
  </div>
);

export default function StakingResult({ result, toolType }: StakingResultProps) {
  if (!result) return null;
  
  if (!result.success) {
    return (
        <ErrorResult error={result.error || "Operation failed"} />
    );
  }
  
  switch (toolType) {
    case "tool-getAccountBalance":
      return (
          <AccountBalanceResult data={result} />
      );
    
    case "tool-u2u_staking_get_user_stake":
      return (
          <UserStakeResult data={result} />
      );
    
    case "tool-getCurrentEpoch":
      return (
          <CurrentEpochResult data={result} />
      );
    
    case "tool-getTotalStake":
    case "tool-getTotalActiveStake":
      return (
          <TotalStakeResult data={result} />
      );
    
    case "tool-getValidatorInfo":
      return (
          <ValidatorInfoResult data={result} />
      );
    
    case "tool-getPendingRewards":
    case "tool-u2u_staking_get_pending_rewards":
      return (
          <PendingRewardsResult data={result} />
      );
    
    case "tool-u2u_staking_get_rewards_stash":
      return (
          <RewardsStashResult data={result} />
      );
    
    case "tool-u2u_staking_get_unlocked_stake":
      return (
          <UnlockedStakeResult data={result} />
      );
    
    case "tool-u2u_staking_get_lockup_info":
      return (
          <LockupInfoResult data={result} />
      );
    
    default:
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Staking data received. Check AI response for details.
        </div>
      );
  }
}
