import mongoose from "mongoose";
import { generateUniqueInvitationCode } from "../../utils/genarateInvitationCode";
import { ProductModel } from "../product/product.model";
import { TUser } from "./user.interface";
import { User_Model } from "./user.schema";
import bcrypt from "bcrypt";
import { HistoryModel } from "../history/history.model";
import { Withdraw_Model } from "../withdrow/withdrow.model";
import { SelectedProducts } from "../selectedProduct/selectedProduct.model";

const createUser = async (payload: Partial<TUser>) => {
  const exists = await User_Model.findOne({
    $or: [
      { phoneNumber: payload.phoneNumber },
    ],
  });

  if (exists) {
    if (exists.phoneNumber === payload.phoneNumber) {
      throw new Error("Phone number already exists.");
    }
  }

  if (!payload.password) {
    throw new Error("Password is required");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const userData = {
    ...payload,
    password: hashedPassword,
    userBalance: 6,
    invitationCode: await generateUniqueInvitationCode(),
  };

  try {
    console.log('userData', userData)
    const user = await User_Model.create(userData);

    console.log('user', user)
    return user;
  } catch (error: any) {
    console.log("CREATE USER ERROR:", error);
    console.log("MESSAGE:", error.message);
    console.log("ERRORS:", error.errors);
    throw error;
  }
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
    User_Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('assainProductsIds'),

    User_Model.countDocuments(filter),
  ]);

  return {
    data,
  };
};
const getUserByUserId = async (userId: number) => {
  console.log("userid ", userId);
  return await User_Model.findOne({ userId: userId }).populate({
    path: "assainProductsIds",
    populate: {
      path: "products.productId",
      model: "Product",
      select: "_id productId status poster  name  introduction"
    },
  });
};

const updateUser = async (id: string, payload: Partial<TUser>) => {
  return await User_Model.findByIdAndUpdate(id, payload, {
    new: true,
  });
};

const deleteUser = async (id: number) => {
  return await User_Model.findOneAndDelete({ userId: id });
};

const rechargeUserBalance = async (userId: number, amount: number) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User_Model.findOne({ userId }).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await User_Model.findOneAndUpdate(
      { userId },
      {
        $inc: {
          userBalance: amount,
        },
      },
      {
        new: true,
        session,
      }
    );

    // Save history
    await HistoryModel.create(
      [
        {
          userId: user._id,
          historyType: "recharge",
          amount,
          time: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return updatedUser;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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



const assignProducts = async (userId: number, products: any[], type: 'trial' | 'normal' | 'group') => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User_Model.findOne({ userId }).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    // 1. Create SelectedProducts
    const createSelectProducts = await SelectedProducts.create(
      [
        {
          userId: user._id,
          products,
          type
        },
      ],
      { session }
    );

    const selectedProductId = createSelectProducts[0]._id;

    const frontendUrl = process.env.FRONTEND_URL || "https://amazoncore.netlify.app";

    const shareableLink = `${frontendUrl}/selected-products/${selectedProductId}`;

    // 2. Update user (single update only)
    const updatedUser = await User_Model.findOneAndUpdate(
      { userId },
      {
        assainProductsIds: selectedProductId,
        shareableLink,
      },
      {
        new: true,
        session,
      }
    ).populate('assainProductsIds');

    await session.commitTransaction();
    session.endSession();

    return {
      user: updatedUser,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const buyProduct = async (
  userId: string,
  selectedProductsIds: string,
  productId: string
) => {
  const user = await User_Model.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const selectedProducts = await SelectedProducts.findById(selectedProductsIds);

  if (!selectedProducts) {
    throw new Error("Selected products not found");
  }

  // Find product inside products array
  const buyProduct = selectedProducts.products.find(
    (product: any) => product.productId.toString() === productId
  );

  if (!buyProduct) {
    throw new Error("Product not found");
  }

  // Check already completed
  if (buyProduct.status === "completed") {
    throw new Error("Product already purchased");
  }

  // Check balance
  if (user.userBalance < buyProduct.price) {
    throw new Error("Insufficient balance");
  }

  // price + commission
  const totalAmount =
    buyProduct.price +
    (buyProduct.price * buyProduct.commission) / 100;

  // Update user balance
  const updatedUser = await User_Model.findByIdAndUpdate(
    userId,
    {
      $inc: {
        userBalance: -buyProduct.price, // deduct
        withdrawAbleBalance: totalAmount, // add
      },
    },
    { new: true }
  );

  // Update product status
  await SelectedProducts.updateOne(
    {
      _id: selectedProductsIds,
      "products.productId": productId,
    },
    {
      $set: {
        "products.$.status": "completed",
      },
    }
  );

  return updatedUser;
};


const updateMultipleProductPrices = async (
  selectedProductsId: string,
  updates: { productItemId: string; price: number; commission?: number }[]
) => {
  console.log('  selectedProductsId ', selectedProductsId)
  console.log(' updates ', updates)
  const bulkOperations = updates.map((item) => ({
    updateOne: {
      filter: {
        _id: selectedProductsId,
        "products.productId": item.productItemId,
      },
      update: {
        $set: {
          "products.$.price": item.price,
          ...(item.commission !== undefined && {
            "products.$.commission": item.commission,
          }),
        },
      },
    },
  }));

  const result = await SelectedProducts.bulkWrite(bulkOperations);
  console.log('updated', result)

  return result;
};

const updateIsgroupOrderAccepted = async (selectedProductsIds: string) => {
  const selectedProducts = await SelectedProducts.findOne({ _id: selectedProductsIds });
  if (!selectedProducts) {
    throw new Error("Selected products not found");
  }
  const updatedSelectedProducts = await SelectedProducts.findOneAndUpdate(
    { _id: selectedProductsIds },
    {
      isgroupOrderAccepted: true,
    },
    { new: true }
  );
  return updatedSelectedProducts;
}

const freezeUser = async (id: number, isFreeze: boolean) => {
  return await User_Model.findOneAndUpdate(
    { userId: id },
    { freezeUser: isFreeze },
    { new: true },
  );
};
const resetAssignProductsIds = async (userId: number) => {
  return await User_Model.findOneAndUpdate(
    { userId },
    { assainProductsIds: null, shareableLink: null },
    { new: true },
  );
};






export const user_services = {
  createUser,
  getAllUsers,

  getUserByUserId,
  updateUser,
  deleteUser,
  rechargeUserBalance,
  decreaseUserBalance,
  updateWithdrawalAddress,
  updatePasswordFromAdmin,
  assignProducts, buyProduct,
  updateIsgroupOrderAccepted,
  updateMultipleProductPrices,
  freezeUser,
  resetAssignProductsIds
};
