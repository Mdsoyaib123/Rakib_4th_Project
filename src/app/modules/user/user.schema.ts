import mongoose, { Schema } from "mongoose";
import { TUser } from "./user.interface";

const userSchema = new Schema<TUser>(
  {
    name: { type: String },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    password: { type: String, required: true },
    invitationCode: {
      type: String,
      required: true,
      unique: true,
    },
    superiorUserId: { type: String },
    superiorUserName: { type: String },
    userId: {
      type: Number,
      unique: true,
      default: () => Math.floor(1000000 + Math.random() * 9000000),
    },
    userDiopsitType: {
      type: String,
      enum: ["trial", "deposit"],
      default: "trial",
    },

    orderRound: {
      type: {
        round: {
          type: String,
          enum: ["trial", "round_one", "round_two"],
          required: true,
          default: "trial",
        },
        status: {
          type: Boolean,
          default: true,
        },
      },
      default: {
        round: "trial",
        status: true,
      },
    },
    level: { type: Number, default: 1 },
    freezeUser: { type: Boolean, default: true },

    quantityOfOrders: { type: Number, default: 0 },
    completedOrdersCount: { type: Number, default: 0 },
    withdrawalAddressAndMethod: {
      type: {
        name: {
          type: String,
          required: true,
        },

        withdrawMethod: {
          type: String,
          enum: ["MobileBanking", "BankTransfer"],
          required: true,
        },

        // Bank Transfer fields
        bankName: {
          type: String,
          required: function () {
            return this.withdrawMethod === "BankTransfer";
          },
        },
        bankAccountNumber: {
          type: Number,
          required: function () {
            return this.withdrawMethod === "BankTransfer";
          },
        },
        branchName: {
          type: String,
        },
        district: {
          type: String,
        },

        // Mobile Banking fields
        mobileBankingName: {
          type: String,
          required: function () {
            return this.withdrawMethod === "MobileBanking";
          },
        },
        mobileBankingAccountNumber: {
          type: Number,
          required: function () {
            return this.withdrawMethod === "MobileBanking";
          },
        },
        mobileUserDistrict: {
          type: String,
          required: function () {
            return this.withdrawMethod === "MobileBanking";
          },
        },
      },
      default: null,
    },

    withdrowalValidOddNumber: { type: Number, default: 0 },
    actualCompletedNumberToday: { type: Number, default: 0 },

    userBalance: { type: Number, required: true, default: 0 },
    trialRoundBalance: { type: Number, default: 0 },
    dailyProfit: { type: Number, default: 0 },
    freezeWithdraw: { type: Boolean, default: false },
    memberTotalRecharge: { type: Number, default: 0 },
    memberTotalWithdrawal: { type: Number, default: 0 },

    userOrderFreezingAmount: { type: Number, default: 0 },
    amountFrozedInWithdrawal: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    mobilePhoneAreaCode: { type: String },

    lastLoginIp: { type: String },
    lastLoginTime: { type: Date },

    userType: { type: String, required: true, default: "Normal" },
    userOrderAmountSlot: {
      type: [Number],
      default: [8500, 20000, 60000, 100000, 200000, 300000, 500000, 700000, 1000000],
    },
    userSelectedPackage: { type: Number },

    adminAssaignProductsOrRewards: {
      type: [
        {
          productId: { type: Number },
          orderNumber: { type: Number },
          mysterybox: {
            type: {
              method: {
                type: String,
                enum: ["cash", "12x"],
              },
              amount: {
                type: String,
              },
              seenTheReward: {
                type: Boolean,
                default: false,
                required: false,
              },
            },
            required: false, // ✅ optional
            default: undefined,
          },
        },
      ],
      default: [],
    },
    cashback: {
      type: [Number],
      required: false
    },
    mysteryReward: {
      type: Number,
      default: 0,
    },
    dailyCheckInReward: {
      type: {
        lastCheckInDate: {
          type: Date,
          default: null,
        },
        totalCheckIns: {
          type: Number,
          default: 0,
        },
      },
      default: {
        lastCheckInDate: null,
        totalCheckIns: 0,
      },
    },

    completedOrderProducts: { type: [String], default: [] },
    uncompletedOrderProducts: { type: [String], default: [] },
    orderCountForCheckIn: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    outOfBalance: { type: Number, default: 0 },
    withdrawPassword: { type: String, default: null },
    lastSpinAt: { type: Date }
  },
  { timestamps: true },
);

export const User_Model = mongoose.model<TUser>("User", userSchema);
