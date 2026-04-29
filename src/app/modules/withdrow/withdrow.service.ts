import mongoose from "mongoose";
import { User_Model } from "../user/user.schema";
import { Withdraw_Model } from "./withdrow.model";
import { TWithdraw } from "./withdrow.interface";
import bcrypt from "bcrypt";

type CreateWithdrawPayload = {
  userId: number;
  amount: number;
};

const createWithdrawService = async (payload: CreateWithdrawPayload) => {
  const { userId, amount } = payload;

  const user = await User_Model.findOne({ userId });


  if (!user) throw new Error("User not found");



  const withdrawal = user.withdrawalAddressAndMethod;

  if (!withdrawal || !withdrawal.withdrawMethod) {
    throw new Error("Please add withdrawal address first");
  }

  if (
    withdrawal.withdrawMethod === "BankTransfer" &&
    (!withdrawal.bankName || !withdrawal.bankAccountNumber)
  ) {
    throw new Error("Please add bank withdrawal details");
  }

  if (
    withdrawal.withdrawMethod === "MobileBanking" &&
    (!withdrawal.mobileBankingName || !withdrawal.mobileBankingAccountNumber)
  ) {
    throw new Error("Please add mobile banking withdrawal details");
  }

  if (amount <= 0) throw new Error("Invalid withdrawal amount");

  if (user.userBalance < amount) throw new Error("Insufficient balance");

  if (amount < 6) {
    throw new Error("Minimum withdrawal amount is $6");
  }

  const withdrawalMethod = user.withdrawalAddressAndMethod;

  if (!withdrawalMethod) {
    throw new Error("Withdrawal address not set");
  }

  const withdrawPayload: Partial<TWithdraw> = {
    userId: user.userId,
    amount,
    name: user.name || "N/A",

    withdrawMethod: withdrawalMethod.withdrawMethod,

    withdrawalAmount: amount,
    totalRechargeAmount: user.memberTotalRecharge,
    totalWithdrawalAmount: user.memberTotalWithdrawal,

    transactionStatus: "PENDING",
    applicationTime: new Date(),
  };

  // Bank Transfer
  if (withdrawalMethod.withdrawMethod === "BankTransfer") {
    withdrawPayload.bankName = withdrawalMethod.bankName;
    withdrawPayload.bankAccountNumber =
      withdrawalMethod?.bankAccountNumber as number;
    withdrawPayload.branchName = withdrawalMethod.branchName;
    withdrawPayload.district = withdrawalMethod.district;
  }

  // Mobile Banking
  if (withdrawalMethod.withdrawMethod === "MobileBanking") {
    withdrawPayload.mobileBankingName = withdrawalMethod.mobileBankingName;
    withdrawPayload.mobileBankingAccountNumber =
      withdrawalMethod?.mobileBankingAccountNumber as number;
    withdrawPayload.mobileUserDistrict = withdrawalMethod.mobileUserDistrict;
  }

  const withdraw = await Withdraw_Model.create(withdrawPayload);

  // ✅ Freeze user balance
  await User_Model.updateOne(
    { userId },
    {
      $inc: {
        withdrawAbleBalance: -amount,
        memberTotalWithdrawal: +amount,
      },
    },
  );

  return withdraw;
};
const acceptWithdrawService = async (withdrawId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdraw = await Withdraw_Model.findById(withdrawId).session(session);
    if (!withdraw) throw new Error("Withdrawal not found");

    const user = await User_Model.findOne({ userId: withdraw.userId }).session(
      session,
    );

    if (withdraw.transactionStatus !== "PENDING")
      throw new Error("This Withdrawal request already processed");

    // ✅ Update withdraw status
    withdraw.transactionStatus = "APPROVED";
    withdraw.processingTime = new Date();
    await withdraw.save({ session });

    // ✅ Deduct frozen amount permanently
    await User_Model.updateOne(
      { userId: withdraw.userId },
      {
        $inc: {
          amountFrozedInWithdrawal: -withdraw.withdrawalAmount,
        }, // keeping your logic as-is
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return withdraw;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const rejectWithdrawService = async (
  withdrawId: string,
  reviewRemark?: string,
) => {
  const withdraw = await Withdraw_Model.findById(withdrawId);

  if (!withdraw) throw new Error("Withdrawal not found");
  if (withdraw.transactionStatus !== "PENDING")
    throw new Error("This Withdrawal request already processed");

  // ✅ Update withdraw status
  withdraw.transactionStatus = "REJECTED";
  withdraw.processingTime = new Date();
  withdraw.reviewRemark = reviewRemark || "Rejected by admin";
  await withdraw.save();

  // 🔄 Refund frozen balance
  await User_Model.updateOne(
    { userId: withdraw.userId },
    {
      $inc: {
        withdrawAbleBalance: withdraw.withdrawalAmount,
        memberTotalWithdrawal: -withdraw.withdrawalAmount,
      },
    },
  );

  return withdraw;
};

const getAllWithdrawsService = async (
  page = 1,
  limit = 10,
  transactionStatus?: string,
  userId?: string,
  withdrawalAmount?: number,
  phoneLast4?: string,
) => {
  const skip = (page - 1) * limit;
  const query: any = {};

  // 1️⃣ Transaction status
  if (transactionStatus) {
    query.transactionStatus = transactionStatus;
  }

  // 2️⃣ Withdrawal amount
  if (withdrawalAmount !== undefined && !isNaN(withdrawalAmount)) {
    query.withdrawalAmount = withdrawalAmount;
  }

  // 3️⃣ Filter by phone last 4 digits (highest priority)
  if (phoneLast4) {
    const user = await User_Model.findOne({
      phoneNumber: { $regex: `${phoneLast4}$` },
    }).select("userId");

    if (!user) {
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    query.userId = user.userId;
  }
  // 4️⃣ Otherwise filter by userId
  else if (userId) {
    query.userId = Number(userId);
  }

  // 5️⃣ Fetch data
  const [withdraws, total] = await Promise.all([
    Withdraw_Model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Withdraw_Model.countDocuments(query),
  ]);

  return {
    data: withdraws,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


const getSingleUserWithdraws = async (userId: number, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Withdraw_Model.find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Withdraw_Model.countDocuments({ userId }),
  ]);

  return {
    data,
  };
};

const getSingleWithdraw = async (withdrawId: string) => {
  const withdraw = await Withdraw_Model.findById(withdrawId);
  return withdraw;
};

export const WithdrawService = {
  createWithdrawService,
  acceptWithdrawService,
  rejectWithdrawService,
  getAllWithdrawsService,
  getSingleUserWithdraws,
  getSingleWithdraw,
};
