import { Types } from "mongoose";

export type THistory = {
  userId: Types.ObjectId;
  historyType: "recharge" | "checkIn" | "cashback"
  withdrawStatus?: "PENDING" | "APPROVED" | "REJECTED";
  amount: number;
  time: Date;
  notes?: string;
};
