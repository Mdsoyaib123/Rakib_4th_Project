export type TUser = {
  name?: string;
  phoneNumber: string;
  email: string;
  role: "user" | "admin";
  password: string;
  confirmPassword: string;
  invitationCode: string;
  userId: number;
  userDiopsitType: "trial" | "deposit";
  level: Number;
  freezeUser?: boolean;
  superiorUserId?: string;
  superiorUserName?: string;
  quantityOfOrders?: number;
  orderRound?: {
    round: "trial" | "round_one" | "round_two";
    status: boolean;
  };

  withdrawalAddressAndMethod?: {
    name: string;
    withdrawMethod: "MobileBanking" | "BankTransfer";
    bankName?: string;
    bankAccountNumber?: Number;
    branchName?: string;
    district?: string;

    //mobile banking
    mobileBankingName?: string;
    mobileBankingAccountNumber?: Number;
    mobileUserDistrict: string | undefined;
  };
  withdrowalValidOddNumber?: number;
  actualCompletedNumberToday?: number;
  userBalance: number;
  trialRoundBalance?: number;
  dailyProfit?: number;
  freezeWithdraw?: boolean;
  memberTotalRecharge?: number;
  memberTotalWithdrawal?: number;
  userOrderFreezingAmount?: number;
  amountFrozedInWithdrawal?: number;
  isOnline?: boolean;
  mobilePhoneAreaCode?: string;
  lastLoginIp: string;
  lastLoginTime: Date;
  userType: string;
  userOrderAmountSlot: number[];
  userSelectedPackage?: number;
  completedOrdersCount?: number;
  adminAssaignProductsOrRewards?: {
    productId?: number;
    orderNumber?: number;
    mysterybox?: {
      method: "cash" | "12x";
      amount: string;
      seenTheReward?: boolean;
    };
  }[];
  cashback?: number[]
  mysteryReward?: Number;
  dailyCheckInReward: {
    lastCheckInDate: Date | null;
    totalCheckIns: number;
  };

  completedOrderProducts?: string[];
  uncompletedOrderProducts?: string[];
  orderCountForCheckIn?: number;
  score: number;
  outOfBalance: number;
  withdrawPassword?: string | null;
  lastSpinAt : Date 
};
