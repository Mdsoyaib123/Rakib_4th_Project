import { Types } from "mongoose";

export type TUser = {
  name?: string;
  phoneNumber: string;
  email: string;
  role: "user" | "admin";
  password: string;
  confirmPassword: string;
  invitationCode: string;
  userId: number;

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

  userBalance: number;

  withdrawAbleBalance: number;

  assainProductsIds: Types.ObjectId;
  shareableLink: string;


  memberTotalRecharge?: number;
  memberTotalWithdrawal?: number;

  lastLoginIp: string;
  lastLoginTime: Date;


  outOfBalance: number;
  withdrawPassword?: string | null;

};
