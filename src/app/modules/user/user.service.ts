import mongoose from "mongoose";
import { generateUniqueInvitationCode } from "../../utils/genarateInvitationCode";
import { ProductModel } from "../product/product.model";
import { TUser } from "./user.interface";
import { User_Model } from "./user.schema";
import bcrypt from "bcrypt";
import { HistoryModel } from "../history/history.model";
import { Withdraw_Model } from "../withdrow/withdrow.model";

const createUser = async (payload: Partial<TUser>) => {
  const superiorUser = await User_Model.findOne({
    invitationCode: payload.invitationCode,
  });

  // console.log("superior user id ", superiorUser?.userId);

  if (!superiorUser) {
    throw new Error("invitation code not found");
  }

  const superiorUserId = superiorUser?.userId;
  const superiorUserName = superiorUser?.name;

  payload.superiorUserId = superiorUserId as unknown as string;
  payload.superiorUserName = superiorUserName as string;

  const ieExists = await User_Model.findOne({
    $or: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
  });

  if (ieExists) {
    if (ieExists.email === payload.email) {
      throw new Error("Email already exists. Please use a different email.");
    }

    if (ieExists.phoneNumber === payload.phoneNumber) {
      throw new Error(
        "Phone number already exists. Please use a different phone number.",
      );
    }
  }
  if (payload?.password) {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    payload.password = hashedPassword;
  }

  const invitationCode = await generateUniqueInvitationCode();
  payload.invitationCode = invitationCode;

  payload.quantityOfOrders = 25; // Trial round orders
  payload.userDiopsitType = "trial";
  payload.userBalance = 0;
  payload.trialRoundBalance = 10500;
  payload.userSelectedPackage = 10500;
  payload.orderRound = {
    round: "trial",
    status: true,
  };

  const user = new User_Model(payload);

  // console.log("user", user);
  return await user.save();
};

const getAllUsers = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    userId,
    ip,
    phoneLast4,
    name,
    userType,
    lastLoginTime,
  } = query;

  const filter: any = {};

  // 🔍 User ID
  if (userId) {
    filter.userId = Number(userId);
  }

  // 🔍 IP Address
  if (ip) {
    filter.lastLoginIp = ip;
  }

  // 🔍 Phone last 4 digits
  if (phoneLast4) {
    filter.phoneNumber = { $regex: `${phoneLast4}$` };
  }

  // 🔍 Name (partial match)
  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  // 🔍 User Type
  if (userType) {
    filter.userType = userType;
  }
  // 🔍 Last Login Time (date range)
  if (lastLoginTime) {
    filter.lastLoginTime = {
      $gte: new Date(new Date(lastLoginTime).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(lastLoginTime).setHours(23, 59, 59, 999)),
    };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    User_Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),

    User_Model.countDocuments(filter),
  ]);

  return {
    data,
  };
};
const getUserByUserId = async (userId: number) => {
  console.log("userid ", userId);
  return await User_Model.findOne({ userId: userId });
};

const updateUser = async (id: string, payload: Partial<TUser>) => {
  return await User_Model.findByIdAndUpdate(id, payload, {
    new: true,
  });
};

const deleteUser = async (id: number) => {
  return await User_Model.findOneAndDelete({ userId: id });
};
const freezeUser = async (id: number, isFreeze: boolean) => {
  return await User_Model.findOneAndUpdate(
    { userId: id },
    { freezeUser: isFreeze },
    { new: true },
  );
};

const rechargeUserBalance = async (userId: number, amount: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user: any = await User_Model.findOne({ userId }).session(session);
    if (!user) throw new Error("User not found");

    let newOutOfBalance = user?.outOfBalance || 0;

    if (amount >= newOutOfBalance) {
      newOutOfBalance = 0;
    } else {
      newOutOfBalance = amount - newOutOfBalance;
    }

    const res = await User_Model.findOneAndUpdate(
      { userId },
      {
        $set: {
          userDiopsitType:
            user.orderRound.round === "trial" &&
              user?.orderRound.status === false
              ? "diopsit"
              : user.userDiopsitType,
          "orderRound.round": user.orderRound.round,
          "orderRound.status": false, //
          outOfBalance: newOutOfBalance,
        },
        $inc: {
          userBalance: amount,
          memberTotalRecharge: amount,
        },
      },
      { new: true, session },
    );

    // ✅ Record history
    if (res) {
      await HistoryModel.create(
        [
          {
            userId: user._id, // keep ObjectId
            historyType: "recharge",
            amount,
            time: new Date(),
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const enableOrderRound = async (
  userId: number,
  round: "round_one" | "round_two",
  status: boolean,
) => {
  const user = await User_Model.findOne({ userId });
  if (!user) throw new Error("User not found");
  return await User_Model.findOneAndUpdate(
    { userId },
    {
      $set: {
        "orderRound.round": round,
        "orderRound.status": status,
        quantityOfOrders:
          user?.quantityOfOrders === 0 ? 25 : user?.quantityOfOrders, // admin decides quantity
        completedOrdersCount:
          user?.completedOrdersCount === 25 ? 0 : user?.completedOrdersCount,
      },
    },
    { new: true },
  );
};

const decreaseUserBalance = async (id: number, amount: number) => {
  const user = await User_Model.findOne({ userId: id });
  const newBalance = (user?.userBalance || 0) - amount;
  return await User_Model.findOneAndUpdate(
    { userId: id },
    {
      userBalance: newBalance,
    },
    { new: true },
  );
};
const updateUserOrderAmountSlot = async (
  userId: number,
  amount: number | number[],
) => {
  const updatedUser = await User_Model.findOneAndUpdate(
    { userId: Number(userId) },
    { userOrderAmountSlot: amount },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};
const updateUserSelectedPackageAmount = async (
  userId: number,
  amount: number,
) => {
  const user: any = await User_Model.findOne({ userId: userId });

  if (user?.userBalance < amount) {
    throw new Error("Insufficient balance, please recharge first");
  }

  // const isBlockedRound =
  //   user.orderRound.round !== "round_one" &&
  //   user.orderRound.status === false &&
  //   user.quantityOfOrders > 0;

  // console.log("is blocked", isBlockedRound);

  // if (!isBlockedRound) {
  //   throw new Error(
  //     "Please withdraw your money first, then select another package",
  //   );
  // }

  const isBlockedRound =
    !user.orderRound.status &&
    user.quantityOfOrders <= 0 &&
    ["trial", "round_two"].includes(user.orderRound.round) &&
    user.orderRound.round !== "round_one";

  if (isBlockedRound) {
    throw new Error(
      "Please withdraw your money first, then select another package",
    );
  }

  const updatedUser = await User_Model.findOneAndUpdate(
    { userId: userId },
    { userSelectedPackage: amount },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};
const updateQuantityOfOrders = async (
  userId: number,
  round: string,
  status: boolean,
) => {
  const updatedUser = await User_Model.findOneAndUpdate(
    { userId: userId },
    { "orderRound.round": round, "orderRound.status": status },
    { new: true },
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

const updateAdminAssaignProduct = async (
  userId: number,
  productId?: number,
  orderNumber?: number,
  mysteryboxMethod?: "cash" | "12x",
  mysteryboxAmount?: string,
) => {
  try {
    // 🔴 Order number is mandatory for any mysterybox
    if (mysteryboxMethod && !orderNumber) {
      throw new Error("Order number is required for mysterybox");
    }

    // 🔴 12x MUST have product
    if (mysteryboxMethod === "12x" && !productId) {
      throw new Error("Product is required for 13 mysterybox");
    }

    // 🔴 CASH must NOT have product
    if (mysteryboxMethod === "cash" && productId) {
      throw new Error("Product is not allowed for cash mysterybox");
    }

    // 🔹 CASE 1: Product + orderNumber (optional mysterybox)
    if (productId && orderNumber) {
      const updatedUser = await User_Model.findOneAndUpdate(
        {
          userId,
          "adminAssaignProductsOrRewards.orderNumber": { $ne: orderNumber },
        },
        {
          $push: {
            adminAssaignProductsOrRewards: {
              productId,
              orderNumber,
              ...(mysteryboxMethod && mysteryboxAmount
                ? {
                  mysterybox: {
                    method: mysteryboxMethod,
                    amount: mysteryboxAmount,
                  },
                }
                : {}),
            },
          },
        },
        { new: true },
      );

      if (!updatedUser) {
        throw new Error(
          `Order number ${orderNumber} already assigned or user not found`,
        );
      }

      return updatedUser;
    }

    // 🔹 CASE 2: CASH mysterybox (order-based, NO product)
    if (mysteryboxMethod === "cash" && mysteryboxAmount && orderNumber) {
      const updatedUser = await User_Model.findOneAndUpdate(
        {
          userId,
          "adminAssaignProductsOrRewards.orderNumber": { $ne: orderNumber },
        },
        {
          $push: {
            adminAssaignProductsOrRewards: {
              orderNumber,
              mysterybox: {
                method: "cash",
                amount: mysteryboxAmount,
              },
            },
          },
        },
        { new: true },
      );

      if (!updatedUser) {
        throw new Error(
          `Order number ${orderNumber} already assigned or user not found`,
        );
      }

      return updatedUser;
    }

    throw new Error("Invalid assignment payload");
  } catch (error: any) {
    console.error("❌ Error in updateAdminAssaignProduct:", error.message);
    throw new Error(error.message || "Failed to assign product or reward");
  }
};

const removeMysteryReward = async (userId: number) => {
  try {
    if (!userId) {
      throw new Error("UserId is required");
    }

    const user = await User_Model.findOne({ userId }).select("mysteryReward");

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await User_Model.findOneAndUpdate(
      { userId },
      {
        $inc: {
          userBalance: user.mysteryReward,
          dailyProfit: user.mysteryReward,
        },
        $unset: { mysteryReward: 0 },
      },
      { new: true },
    );

    return updatedUser;
  } catch (error: any) {
    console.error("❌ Error in removeMysteryReward:", error.message);
    throw new Error(error.message || "Failed to remove mystery reward");
  }
};
const addCheckInReward = async (userId: number, checkInAmount: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!userId) {
      throw new Error("UserId is required");
    }

    const user: any = await User_Model.findOne({ userId }).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    // ❌ Trial round users cannot check in
    if (user?.orderRound?.round === "trial") {
      throw new Error("Daily check-in is not available in trial round");
    }


    //add new logic for checkIn 
    if (user.orderRound !== "round_two" && user.quantityOfOrders !== 0) {
      throw new Error("Complete at least 40 orders to enable daily check-in");
    }




    if (user?.orderCountForCheckIn <= 40) {
      // ❌ Must complete at least 40 orders
      throw new Error("Complete at least 40 orders to enable daily check-in");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckIn = user.dailyCheckInReward?.lastCheckInDate
      ? new Date(user.dailyCheckInReward.lastCheckInDate)
      : null;

    if (lastCheckIn) {
      lastCheckIn.setHours(0, 0, 0, 0);

      // ❌ Already checked in today
      if (lastCheckIn.getTime() === today.getTime()) {
        throw new Error("You have already checked in today");
      }
    }

    // ✅ Update user balance & daily check-in
    const updatedUser = await User_Model.findOneAndUpdate(
      { userId },
      {
        $inc: {
          userBalance: checkInAmount,
          dailyProfit: checkInAmount,
          "dailyCheckInReward.totalCheckIns": 1,
        },
        $set: {
          "dailyCheckInReward.lastCheckInDate": new Date(),
        },
      },
      { new: true, session },
    );

    // ✅ Add history
    if (updatedUser) {
      await HistoryModel.create(
        [
          {
            userId: user._id,
            historyType: "checkIn",
            amount: checkInAmount,
            time: new Date(),
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return updatedUser;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error in addCheckInReward:", error.message);
    throw new Error(error.message || "Failed to add daily check-in reward");
  }
};

const purchaseOrder = async (userId: number) => {
  const user: any = await User_Model.findOne({ userId }).lean();
  // console.log("user", user);

  const isWithdrawPending = await Withdraw_Model.findOne({
    userId,
    transactionStatus: "PENDING",
  }).lean();

  if (isWithdrawPending) {
    throw new Error(
      "You have pending withdrawal request,Please wait for complete it .",
    );
  }

  if (!user) throw new Error("User not found");
  if (user.freezeUser)
    return { success: false, message: "User account is frozen" };
  if (!user.userSelectedPackage)
    return { success: false, message: "Please select a slot first" };
  if (!user.orderRound.status) {
    return { success: false, message: "Insufficient order quantity" };
  }

  if (user.quantityOfOrders <= 0)
    return { success: false, message: "Insufficient order quantity" };

  // 🔢 Order number preview
  const currentOrderNumber = user.completedOrdersCount + 1;

  let product: any;
  let isAdminAssigned = false;
  let outOfBalance = 0;

  const forcedProductRule = user.adminAssaignProductsOrRewards?.find(
    (rule: any) => rule.orderNumber === currentOrderNumber,
  );

  console.log("forcedProductRule", forcedProductRule);

  if (
    forcedProductRule?.mysterybox?.method === "12x" &&
    forcedProductRule?.productId
  ) {
    product = await ProductModel.findOne({
      productId: forcedProductRule.productId,
    });
    // if (!product) throw new Error("Assigned product not found");

    isAdminAssigned = true;

    // ✅ Calculate deficit
    if (user.userBalance < product?.price) {
      outOfBalance = product?.price - user.userBalance;
    }

    await User_Model.updateOne(
      {
        userId,
        "adminAssaignProductsOrRewards.orderNumber": currentOrderNumber,
        "adminAssaignProductsOrRewards.mysterybox.seenTheReward": false,
      },
      {
        $set: {
          "adminAssaignProductsOrRewards.$.mysterybox.seenTheReward": true,
        },
      },
    );
  } else if (
    forcedProductRule?.mysterybox?.method === "cash" &&
    forcedProductRule?.orderNumber &&
    !forcedProductRule?.productId
  ) {
    const products = await ProductModel.aggregate([
      { $match: { price: { $lte: user?.userSelectedPackage } } },
      { $sample: { size: 1 } },
    ]);

    if (!products.length) {
      return {
        success: false,
        message: "Insufficient balance to purchase any product",
      };
    }

    product = products[0];

    await User_Model.updateOne(
      {
        userId,
        "adminAssaignProductsOrRewards.orderNumber": currentOrderNumber,
        "adminAssaignProductsOrRewards.mysterybox.seenTheReward": false,
      },
      {
        $set: {
          "adminAssaignProductsOrRewards.$.mysterybox.seenTheReward": true,
        },
      },
    );
  } else if (
    !forcedProductRule?.mysterybox?.method &&
    !forcedProductRule?.mysterybox?.amount &&
    forcedProductRule?.productId &&
    forcedProductRule?.orderNumber
  ) {
    product = await ProductModel.findOne({
      productId: forcedProductRule.productId,
    });
    // if (!product) throw new Error("Assigned product not found");

    isAdminAssigned = true;

    // ✅ Calculate deficit
    if (user.userBalance < product?.price) {
      outOfBalance = product?.price - user.userBalance;
    }
  } else {
    // // console.log("hit the logic ------------------");
    // const products = await ProductModel.aggregate([
    //   { $match: { price: { $lte: user?.userSelectedPackage } } },
    //   { $sample: { size: 1 } },
    // ]);

    // if (!products.length) {
    //   return {
    //     success: false,
    //     message: "Insufficient balance to purchase any product",
    //   };
    // }

    //new logic

    const usedProductIds = user.completedOrderProducts?.length
      ? user.completedOrderProducts.map(Number)
      : [];

    let products = await ProductModel.aggregate([
      {
        $match: {
          price: { $lte: user.userSelectedPackage },
          ...(usedProductIds.length && {
            productId: { $nin: usedProductIds },
          }),
        },
      },
      { $sample: { size: 1 } },
    ]);

    if (!products.length) {
      products = await ProductModel.aggregate([
        { $match: { price: { $lte: user.userSelectedPackage } } },
        { $sample: { size: 1 } },
      ]);
    }

    product = products[0];
  }

  console.log("product", product);

  const productCommisionTenpercent =
    forcedProductRule?.mysterybox?.method === "cash"
      ? product.commission
      : forcedProductRule?.mysterybox?.method === "12x"
        ? (product?.price * 48) / 100
        : (product?.price * 12.8) / 100;

  console.log("ten persent", productCommisionTenpercent);

  await User_Model.updateOne({ userId }, { $set: { outOfBalance } });

  console.log("commision for all ", productCommisionTenpercent);

  return {
    orderNumber: currentOrderNumber,
    product,
    isAdminAssigned,
    outOfBalance: outOfBalance,
    mysteryboxMethod:
      forcedProductRule?.mysterybox?.method === "12x"
        ? forcedProductRule?.mysterybox?.method
        : !forcedProductRule?.mysterybox?.method &&
          !forcedProductRule?.mysterybox?.amount &&
          forcedProductRule?.productId &&
          forcedProductRule?.orderNumber
          ? "3x"
          : null,
    mysteryboxAmount: forcedProductRule?.mysterybox?.amount
      ? forcedProductRule?.mysterybox?.amount
      : null,
    seenTheReward: forcedProductRule?.mysterybox
      ? forcedProductRule?.mysterybox?.seenTheReward
      : null,
    commission: forcedProductRule
      ? productCommisionTenpercent
      : product.commission,
  };
};

const confirmedPurchaseOrder = async (userId: number, productId: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user: any = await User_Model.findOne({ userId }).session(session);

    if (user.quantityOfOrders === 0) {
      await User_Model.updateOne(
        { userId },
        { $set: { "orderRound.status": false } },
        { session },
      );
    }

    if (!user) throw new Error("User not found");
    if (user.quantityOfOrders <= 0)
      return {
        message:
          "Insufficient order quantity . Please contact Support Line",
      };

    const currentOrderNumber = user.completedOrdersCount + 1;

    const product = await ProductModel.findOne({
      productId: productId,
    }).session(session);

    console.log("product", product);

    if (!product) throw new Error("Product not found");

    if (
      (user.userDiopsitType === "trial" && user?.memberTotalRecharge === 0
        ? user.trialRoundBalance
        : user.userBalance) < product?.price
    ) {
      await User_Model.updateOne(
        { userId },
        {
          $addToSet: {
            uncompletedOrderProducts: product.productId.toString(),
          },
        },
        { session },
      );
      await session.commitTransaction();
      session.endSession();

      return {
        success: false,
        message:
          "Insufficient balance to purchase this product. Please contact Support Line",
      };
    }

    let forcedProductRule: any = null;

    forcedProductRule = user.adminAssaignProductsOrRewards?.find(
      (rule: any) => rule.orderNumber === currentOrderNumber,
    );

    if (forcedProductRule?.mysterybox?.method === "cash") {
      await User_Model.updateOne(
        { userId },
        {
          $inc: {
            userBalance: forcedProductRule.mysterybox.amount,
          },
        },
        { session },
      );
      // console.log("cash amount for userData updated");
    }

    const productCommisionTenpercent =
      forcedProductRule?.mysterybox?.method === "cash"
        ? product.commission
        : forcedProductRule?.mysterybox?.method === "12x"
          ? (product?.price * 48) / 100
          : (product?.price * 12.8) / 100;

    // console.log("ten persent", productCommisionTenpercent);
    // console.log("prodcut commision", product.commission);

    // ✅ SAME UPDATE LOGIC
    const updateQuery: any = {
      $inc: {
        quantityOfOrders: -1,
        completedOrdersCount: 1,
        orderCountForCheckIn:
          user?.orderRound.round === "round_one" ||
            user?.orderRound.round === "round_two"
            ? 1
            : 0,
        userBalance: forcedProductRule
          ? Number(productCommisionTenpercent)
          : product.commission,

        dailyProfit: forcedProductRule
          ? Number(productCommisionTenpercent)
          : product.commission,
      },
      $push: {
        completedOrderProducts: product.productId.toString(),
      },
      $pull: {
        uncompletedOrderProducts: product.productId.toString(), // ✅ REMOVE HERE
      },
    };
    if (
      user.quantityOfOrders === 1 &&
      (user.orderRound.round === "trial" ||
        user.orderRound.round === "round_two")
    ) {
      updateQuery.$set = {
        userSelectedPackage: 0,
        "orderRound.status": false,
      };
    }

    if (forcedProductRule) {
      updateQuery.$pull = {
        ...updateQuery.$pull,
        adminAssaignProductsOrRewards: { orderNumber: currentOrderNumber },
      };
    }

    await User_Model.updateOne({ userId }, updateQuery, { session });

    const updatedUser = await User_Model.findOne({ userId }).session(session);

    if (
      updatedUser?.userDiopsitType === "trial" &&
      updatedUser?.quantityOfOrders === 0
    ) {
      await User_Model.updateOne(
        { userId },
        { $set: { trialRoundBalance: 0 } },
        { session },
      );
    }

    if (product.isAdminAssigned) {
      await ProductModel.updateOne(
        { productId: product.productId },
        { $set: { isAdminAssigned: false } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      orderNumber: currentOrderNumber,
      productId: product.productId,
      user,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateWithdrawalAddress = async (userId: number, payload: any) => {
  const { withdrawMethod } = payload;

  if (!withdrawMethod) {
    throw new Error("withdrawMethod is required");
  }

  let cleanedPayload: any = {
    name: payload.name,
    withdrawMethod,
  };

  if (withdrawMethod === "BankTransfer") {
    cleanedPayload = {
      ...cleanedPayload,
      bankName: payload.bankName,
      bankAccountNumber: payload.bankAccountNumber,
      branchName: payload.branchName,
      district: payload.district,
    };
  }

  if (withdrawMethod === "MobileBanking") {
    cleanedPayload = {
      ...cleanedPayload,
      mobileBankingName: payload.mobileBankingName,
      mobileBankingAccountNumber: payload.mobileBankingAccountNumber,
      mobileUserDistrict: payload.mobileUserDistrict,
    };
  }

  console.log("clean payload", cleanedPayload);

  const updateData: any = {
    withdrawalAddressAndMethod: cleanedPayload,
  };

  if (payload.withdrawPassword) {
    const hashedPassword = await bcrypt.hash(payload.withdrawPassword, 10);
    updateData.withdrawPassword = hashedPassword;
  }

  return await User_Model.findOneAndUpdate(
    { userId },
    {
      $set: updateData,
    },
    { new: true, runValidators: true },
  );
};

const getUserCompletedProducts = async (userId: number) => {
  const user = await User_Model.findOne({ userId }).lean();

  if (!user || !user.completedOrderProducts?.length) {
    return [];
  }

  // convert string ids → number ids
  const productIds = user?.completedOrderProducts
    .map((id) => Number(id))
    .reverse();

  // fetch all unique products once (performance)
  const products = await ProductModel.find({
    productId: { $in: productIds },
  }).lean();
  console.log("products", products);

  // create lookup map
  const productMap = new Map<number, any>();
  products.forEach((p) => productMap.set(p.productId, p));

  // rebuild array WITH duplicates
  const result = productIds.map((id) => productMap.get(id)).filter(Boolean);

  return result;
};
const getUserUnCompletedProducts = async (userId: number) => {
  const user = await User_Model.findOne({ userId }).lean();

  if (!user || !user.uncompletedOrderProducts?.length) {
    return [];
  }

  // convert string ids → number ids
  const productIds = user?.uncompletedOrderProducts
    .map((id) => Number(id))
    .reverse();

  // fetch all unique products once (performance)
  const products = await ProductModel.find({
    productId: { $in: productIds },
  }).lean();
  console.log("products", products);

  // create lookup map
  const productMap = new Map<number, any>();
  products.forEach((p) => productMap.set(p.productId, p));

  // rebuild array WITH duplicates
  const result = productIds.map((id) => productMap.get(id)).filter(Boolean);

  return result;
};
const updateScore = async (userId: number, payload: any) => {
  console.log("userId and score ", userId, payload);
  return await User_Model.findOneAndUpdate(
    { userId: userId },
    { score: payload },
    { new: true },
  );
};
const updateLevel = async (userId: number, payload: any) => {
  console.log("userId and score ", userId, payload);
  return await User_Model.findOneAndUpdate(
    { userId: userId },
    { level: payload },
    { new: true },
  );
};

const addCashback = async (userId: number, payload: any) => {
  console.log("userId and cashback ", userId, payload);

  const res: any = await User_Model.findOneAndUpdate(
    { userId: userId },
    {
      $push: {
        cashback: payload, // single number
      },
    },
    { new: true } // return updated doc
  );

  if (res) {
    await HistoryModel.create({
      userId: res._id,
      historyType: "cashback",
      amount: payload,
      time: new Date(),
    });
  }

  return res

};
const resetCashback = async (userId: number) => {
  return await User_Model.findOneAndUpdate(
    { userId: userId },
    {
      $set: {
        cashback: [], // reset array
      },
    },
    { new: true } // return updated doc
  );
};


const udpateFreezeWithdraw = async (userId: number, payload: boolean) => {
  console.log("payload", payload);
  try {
    if (typeof payload !== "boolean") {
      throw new Error("freezeWithdraw must be a boolean value");
    }

    const updatedUser = await User_Model.findOneAndUpdate(
      { userId },
      {
        $set: {
          freezeWithdraw: payload,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  } catch (error: any) {
    console.error("❌ Error updating freezeWithdraw:", error.message);
    throw new Error(error.message || "Failed to update freezeWithdraw");
  }
};

const getUserWithdrawAddress = async (userId: number) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await User_Model.findOne(
    { userId },
    { withdrawalAddressAndMethod: 1, _id: 0 },
  ).lean();

  if (!user) {
    throw new Error("User not found");
  }

  return user.withdrawalAddressAndMethod ?? null;
};

const updateWithdrawPassword = async (userId: number, payload: string) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!payload) {
    throw new Error("Withdrawal password is required");
  }

  // 🔐 hash withdrawal password
  const hashedPassword = await bcrypt.hash(payload, 10);

  const updateUser = await User_Model.findOneAndUpdate(
    { userId },
    {
      $set: {
        withdrawPassword: hashedPassword,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updateUser) {
    throw new Error("User not found");
  }

  return updateUser;
};

const addBonusReward = async (
  userId: number,
  amount: number,
  notes: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const updateUser = await User_Model.findOneAndUpdate(
    { userId },
    { $inc: { userBalance: amount } },
    { new: true },
  );

  if (updateUser) {
    await HistoryModel.create({
      userId: updateUser._id,
      historyType: "recharge",
      amount: amount,
      time: new Date(),
      notes: notes,
    });
  }
  return updateUser;
};
const getSuperiorUserRechargeAndWithdraw = async (
  groupBy: "day" | "month" = "day",
  filterSuperiorUserId?: string,
) => {
  // 1️⃣ Get all superior user IDs
  let superiorUserIds: string[] = await User_Model.distinct("superiorUserId", {
    superiorUserId: { $ne: null },
  });

  if (filterSuperiorUserId) {
    superiorUserIds = superiorUserIds.filter(
      (id) => id === filterSuperiorUserId,
    );
    if (superiorUserIds.length === 0) return []; // no matching superior user
  }

  // 2️⃣ Recharge aggregation
  const rechargeAgg = await HistoryModel.aggregate([
    { $match: { historyType: "recharge", notes: { $exists: false } } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    ...(filterSuperiorUserId
      ? [{ $match: { "user.superiorUserId": filterSuperiorUserId } }]
      : []),
    {
      $group: {
        _id: {
          superiorUserId: "$user.superiorUserId",
          period:
            groupBy === "month"
              ? { $dateToString: { format: "%Y-%m", date: "$time" } }
              : { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
        },
        totalRecharge: { $sum: "$amount" },
      },
    },
  ]);

  // 3️⃣ Withdraw aggregation
  const withdrawAgg = await Withdraw_Model.aggregate([
    { $match: { transactionStatus: "APPROVED" } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "userId",
        as: "user",
      },
    },
    { $unwind: "$user" },
    ...(filterSuperiorUserId
      ? [{ $match: { "user.superiorUserId": filterSuperiorUserId } }]
      : []),
    {
      $group: {
        _id: {
          superiorUserId: "$user.superiorUserId",
          period:
            groupBy === "month"
              ? { $dateToString: { format: "%Y-%m", date: "$applicationTime" } }
              : {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$applicationTime",
                },
              },
        },
        totalWithdraw: { $sum: "$withdrawalAmount" },
      },
    },
  ]);

  // 4️⃣ Get all periods from recharge/withdraw (or use current period if empty)
  const allPeriods = new Set<string>();
  rechargeAgg.forEach((r) => allPeriods.add(r._id.period));
  withdrawAgg.forEach((w) => allPeriods.add(w._id.period));

  if (allPeriods.size === 0) {
    // No activity at all, show current day/month
    const now = new Date();
    const defaultPeriod =
      groupBy === "month"
        ? now.toISOString().slice(0, 7)
        : now.toISOString().slice(0, 10);
    allPeriods.add(defaultPeriod);
  }

  // 5️⃣ Build the report with **all superior users & periods**
  const report: any[] = [];

  superiorUserIds.forEach((superiorId) => {
    allPeriods.forEach((period) => {
      const recharge = rechargeAgg.find(
        (r) => r._id.superiorUserId === superiorId && r._id.period === period,
      );
      const withdraw = withdrawAgg.find(
        (w) => w._id.superiorUserId === superiorId && w._id.period === period,
      );

      report.push({
        superiorUserId: superiorId,
        period,
        totalRecharge: recharge ? recharge.totalRecharge : 0,
        totalWithdraw: withdraw ? withdraw.totalWithdraw : 0,
      });
    });
  });

  // 6️⃣ Sort
  report.sort(
    (a, b) =>
      a.superiorUserId.localeCompare(b.superiorUserId) ||
      new Date(a.period).getTime() - new Date(b.period).getTime(),
  );

  return report;
};

const getPlatformRechargeAndWithdrawFromSuperiorData = async () => {
  // 1️⃣ Total recharge (exclude notes)
  const rechargeAgg = await HistoryModel.aggregate([
    { $match: { historyType: "recharge", notes: { $exists: false } } },
    { $group: { _id: null, totalRecharge: { $sum: "$amount" } } },
  ]);

  // 2️⃣ Total withdraw (only APPROVED)
  const withdrawAgg = await Withdraw_Model.aggregate([
    { $match: { transactionStatus: "APPROVED" } },
    { $group: { _id: null, totalWithdraw: { $sum: "$withdrawalAmount" } } },
  ]);

  return {
    totalRecharge: rechargeAgg[0]?.totalRecharge || 0,
    totalWithdraw: withdrawAgg[0]?.totalWithdraw || 0,
  };
};

const updatePasswordFromAdmin = async (userId: number, password: string) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!password) {
    throw new Error("Password is required");
  }
  const user = await User_Model.findOne({ userId });
  if (!user) {
    throw new Error("User not found");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();
  return user;
};

// Spin logic
const spinWheelService = async (userId: number, amount: number) => {
  const user = await User_Model.findOne({ userId });

  if (!user) {
    throw new Error("User not found");
  }

  // Check 24h restriction
  if (user.lastSpinAt) {
    const diff = Date.now() - user.lastSpinAt.getTime();

    if (diff < 24 * 60 * 60 * 1000) {
      throw new Error("You can spin after 24 hours");
    }
  }

  user.lastSpinAt = new Date();
  user.userBalance += amount;

  await user.save();

  return user
};

// Status logic
const getWheelStatusService = async (userId: number) => {
  const user = await User_Model.findOne({ userId });

  if (!user) {
    throw new Error("User not found");
  }

  const now = Date.now();
  const lastSpin = user.lastSpinAt?.getTime();

  const canSpin =
    !lastSpin || now - lastSpin >= 24 * 60 * 60 * 1000;

  return { canSpin };
};
export const user_services = {
  createUser,
  getAllUsers,

  getUserByUserId,
  updateUser,
  deleteUser,
  freezeUser,
  rechargeUserBalance,
  enableOrderRound,
  decreaseUserBalance,
  updateUserOrderAmountSlot,
  updateUserSelectedPackageAmount,
  updateQuantityOfOrders,
  updateAdminAssaignProduct,
  removeMysteryReward,
  addCheckInReward,
  purchaseOrder,
  confirmedPurchaseOrder,
  updateWithdrawalAddress,
  getUserCompletedProducts,
  getUserUnCompletedProducts,
  updateScore,
  updateLevel,
  addCashback,
  resetCashback,
  udpateFreezeWithdraw,
  getUserWithdrawAddress,
  updateWithdrawPassword,
  addBonusReward,
  getSuperiorUserRechargeAndWithdraw,
  getPlatformRechargeAndWithdrawFromSuperiorData,
  updatePasswordFromAdmin,
  spinWheelService,
  getWheelStatusService
};
