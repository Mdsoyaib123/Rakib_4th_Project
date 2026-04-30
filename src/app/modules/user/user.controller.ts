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

const assignProducts = async (req: Request, res: Response) => {
  try {
    const { userId, products, type } = req.body;

    if (!products) {
      throw new Error('Required a product')
    }

    const result = await user_services.assignProducts(
      userId,
      products,
      type
    );

    res.status(201).json({
      success: true,
      message: "Products assigned successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const buyProduct = async (req: Request, res: Response) => {
  try {
    const { userId, selectedProductsIds, productId } = req.body;

    if (!productId) {
      throw new Error('Required a product')
    }

    const result = await user_services.buyProduct(
      userId,
      selectedProductsIds,
      productId
    );

    res.status(201).json({
      success: true,
      message: "Product bought successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};


const updateMultipleProductPrices = async (req: Request, res: Response) => {
  try {
    const { selectedProductsId, updatesProductPrices } = req.body;

    const result =
      await user_services.updateMultipleProductPrices(
        selectedProductsId,
        updatesProductPrices
      );

    res.status(200).json({
      success: true,
      message: "Products prices updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateIsgroupOrderAccepted = async (req: Request, res: Response) => {


  try {
    const { selectedProductsIds } = req.params;

    const result = await user_services.updateIsgroupOrderAccepted(
      selectedProductsIds
    );

    res.status(201).json({
      success: true,
      message: "Group order accepted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}


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

const resetAssignProductsIds = async (req: Request, res: Response) => {
  try {
    await user_services.resetAssignProductsIds(
      req.params.userId as unknown as number,
    );
    res.json({
      success: true,
      message: "User assign products ids reset successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};



export const user_controllers = {
  createUser,
  getAllUsers,
  getUserByUserId,
  updateUser,
  deleteUser,
  rechargeUserBalance,
  decreaseUserBalance,

  updateWithdrawalAddress,

  updatePasswordFromAdmin,
  assignProducts,
  buyProduct,
  updateIsgroupOrderAccepted,
  updateMultipleProductPrices,
  freezeUser,
  resetAssignProductsIds
};
