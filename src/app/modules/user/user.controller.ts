import { Request, Response } from "express";
import { user_services } from "./user.service";

const createUser = async (req: Request, res: Response) => {
  try {
    const user = await user_services.createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error: any) {
    // console.error("❌ Create User Error:", error);

    // 🔹 MongoDB duplicate key error
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      if (error.keyPattern?.phoneNumber) {
        return res.status(409).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    // 🔹 Custom business logic errors
    if (
      error.message?.includes("exists") ||
      error.message?.includes("not found") ||
      error.message?.includes("Invalid")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await user_services.getAllUsers({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      userId: req.query.userId as any,
      ip: req.query.ip as string,
      phoneLast4: req.query.phoneLast4 as string,
      name: req.query.name as string,
      userType: req.query.userType as string,
      lastLoginTime: req.query.lastLoginTime as string,
    });

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserByUserId = async (req: Request, res: Response) => {
  try {
    const user = await user_services.getUserByUserId(
      req.params.userId as unknown as number,
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await user_services.updateUser(
      req.params.userId as string,
      req.body,
    );
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    await user_services.deleteUser(req.params.userId as unknown as number);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const freezeUser = async (req: Request, res: Response) => {
  try {
    await user_services.freezeUser(
      req.params.userId as unknown as number,
      req.body.isFreeze,
    );
    res.json({
      success: true,
      message: "User freeze status updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const rechargeUserBalance = async (req: Request, res: Response) => {
  try {
    const result = await user_services.rechargeUserBalance(
      req.params.userId as unknown as number,
      req.body.amount,
    );
    res.json({
      success: true,
      message: "User balance recharged successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const enableOrderRound = async (req: Request, res: Response) => {
  try {
    const { round, status } = req.body;
    const result = await user_services.enableOrderRound(
      req.params.userId as unknown as number,
      round,
      status,
    );
    res.json({
      success: true,
      message: "User order round enabled successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const decreaseUserBalance = async (req: Request, res: Response) => {
  try {
    const result = await user_services.decreaseUserBalance(
      req.params.userId as unknown as number,
      req.body.amount,
    );
    res.json({
      success: true,
      message: "User balance decreased successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserOrderAmountSlot = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const result = await user_services.updateUserOrderAmountSlot(
      userId as unknown as number,
      amount,
    );

    res.status(200).json({
      success: true,
      message: `Amount updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateUserSelectedPackageAmount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const result = await user_services.updateUserSelectedPackageAmount(
      userId as unknown as number,
      amount,
    );

    res.status(200).json({
      success: true,
      message: `Amount updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateQuantityOfOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { quantity, status } = req.body;

    const result = await user_services.updateQuantityOfOrders(
      userId as unknown as number,
      quantity,
      status,
    );

    res.status(200).json({
      success: true,
      message: `Quantity updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateAdminAssaignProduct = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { productId, orderNumber, mysteryboxMethod, mysteryboxAmount } =
      req.body;

    const result = await user_services.updateAdminAssaignProduct(
      userId as unknown as number,
      productId,
      orderNumber,
      mysteryboxMethod,
      mysteryboxAmount,
    );

    res.status(200).json({
      success: true,
      message: `Amount updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const removeMysteryReward = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.removeMysteryReward(
      userId as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: `remove the mystery reward successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const addCheckInReward = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { checkInAmount } = req.body;

    const result = await user_services.addCheckInReward(
      userId as unknown as number,
      checkInAmount as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: `Check In reward added successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const purchaseOrder = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.purchaseOrder(
      userId as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: ` product order  successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const confirmedPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;

    const result = await user_services.confirmedPurchaseOrder(
      userId as unknown as number,
      productId as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: `confirmed product order  successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateWithdrawalAddress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const payload = req.body;

    const result = await user_services.updateWithdrawalAddress(
      userId as unknown as number,
      payload,
    );

    res.status(200).json({
      success: true,
      message: `withdrawal address updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getUserCompletedProducts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.getUserCompletedProducts(
      userId as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: `get user completed products successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getUserUnCompletedProducts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.getUserUnCompletedProducts(
      userId as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: `get user completed products successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateScore = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.updateScore(
      userId as unknown as number,
      req.body.score,
    );

    res.status(200).json({
      success: true,
      message: `score updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateLevel = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.updateLevel(
      userId as unknown as number,
      req.body.level,
    );

    res.status(200).json({
      success: true,
      message: `level updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const udpateFreezeWithdraw = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.udpateFreezeWithdraw(
      userId as unknown as number,
      req.body.freezeWithdraw,
    );

    res.status(200).json({
      success: true,
      message: `withdraw freeze updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getUserWithdrawAddress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.getUserWithdrawAddress(
      userId as unknown as number,
    );

    res.status(200).json({
      success: true,
      message: `get user withdrawal address successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateWithdrawPassword = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await user_services.updateWithdrawPassword(
      userId as unknown as number,
      req.body.withdrawPassword,
    );

    res.status(200).json({
      success: true,
      message: `withdraw password updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const addBonusReward = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, notes } = req.body;

    const result = await user_services.addBonusReward(
      Number(userId) as unknown as number,
      amount as unknown as number,
      notes as string,
    );

    res.status(200).json({
      success: true,
      message: `bonus reward added successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getSuperiorUserRechargeAndWithdraw = async (
  req: Request,
  res: Response,
) => {
  const { groupBy, filterSuperiorUserId } = req.query;

  try {
    const result = await user_services.getSuperiorUserRechargeAndWithdraw(
      groupBy as "day" | "month",
      filterSuperiorUserId as string,
    );

    res.status(200).json({
      success: true,
      message: `get superior user recharge and withdraw successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//extra
const getPlatformRechargeAndWithdrawFromSuperiorData = async (
  req: Request,
  res: Response,
) => {
  const { groupBy, filterSuperiorUserId } = req.query;

  try {
    const result =
      await user_services.getPlatformRechargeAndWithdrawFromSuperiorData();

    res.status(200).json({
      success: true,
      message: `get platform recharge and withdraw successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePasswordFromAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const result = await user_services.updatePasswordFromAdmin(
      Number(userId) as unknown as number,
      newPassword as string,
    );

    res.status(200).json({
      success: true,
      message: `password updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const user_controllers = {
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
  updateQuantityOfOrders,
  updateUserSelectedPackageAmount,
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
  udpateFreezeWithdraw,
  getUserWithdrawAddress,
  updateWithdrawPassword,
  addBonusReward,
  getSuperiorUserRechargeAndWithdraw,
  getPlatformRechargeAndWithdrawFromSuperiorData,
  updatePasswordFromAdmin,
};
