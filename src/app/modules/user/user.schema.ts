import mongoose, { Schema } from "mongoose";
import { TUser } from "./user.interface";

const userSchema = new Schema<TUser>(
  {
    name: { type: String },
    phoneNumber: { type: String, required: true },
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
 freezeUser: { type: Boolean, default: true },
 
    userId: {
      type: Number,
      unique: true,
      default: () => Math.floor(1000000 + Math.random() * 9000000),
    },



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



    userBalance: { type: Number, required: true, default: 0 },
    withdrawAbleBalance: { type: Number, required: true, default: 0 },

    assainProductsIds: {
      type: Schema.Types.ObjectId,
      ref: "SelectedProducts",
      default: null
    },
    shareableLink: { type: String, default: null },



    
    memberTotalRecharge: { type: Number, default: 0 },
    memberTotalWithdrawal: { type: Number, default: 0 },



    lastLoginIp: { type: String },
    lastLoginTime: { type: Date },




    outOfBalance: { type: Number, default: 0 },
    withdrawPassword: { type: String, default: null },

  },
  { timestamps: true },
);

export const User_Model = mongoose.model<TUser>("User", userSchema);
