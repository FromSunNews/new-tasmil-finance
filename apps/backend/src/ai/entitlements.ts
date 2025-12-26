export type UserType = "guest" | "regular" | "wallet";

type Entitlements = {
  maxMessagesPerDay: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 50,
  },

  /*
   * For users with wallet authentication
   */
  wallet: {
    maxMessagesPerDay: 100,
  },
};

