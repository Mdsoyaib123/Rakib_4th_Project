import { Router } from "express";
import { user_controllers } from "./user.controller";

const router = Router();

router.post("/create", user_controllers.createUser);
router.get("/getAll", user_controllers.getAllUsers);
router.get("/getSingle/:userId", user_controllers.getUserByUserId);
router.patch("/update/:userId", user_controllers.updateUser);
router.delete("/delete/:userId", user_controllers.deleteUser);
router.put("/freeze/:userId", user_controllers.freezeUser);
router.put("/recharge/:userId", user_controllers.rechargeUserBalance);
router.put(
  "/admin-order-enable-round/:userId",
  user_controllers.enableOrderRound,
);
router.put("/decrease/:userId", user_controllers.decreaseUserBalance);
// user.route.ts
router.patch(
  "/update-order-amount/:userId",
  user_controllers.updateUserOrderAmountSlot,
);
router.patch(
  "/update-selected-package-amount/:userId",
  user_controllers.updateUserSelectedPackageAmount,
);
router.patch(
  "/update-quantity-of-orders/:userId",
  user_controllers.updateQuantityOfOrders,
);
router.patch(
  "/update-admin-assigned-product/:userId",
  user_controllers.updateAdminAssaignProduct,
);
router.patch(
  "/remove-mystery-reward/:userId",
  user_controllers.removeMysteryReward,
);
router.patch("/add-check-in-reward/:userId", user_controllers.addCheckInReward);
router.get("/purchase-order/:userId", user_controllers.purchaseOrder);
router.patch(
  "/confirmed-purchase-order/:userId/:productId",
  user_controllers.confirmedPurchaseOrder,
);
router.patch(
  "/update-withdrawal-address/:userId",
  user_controllers.updateWithdrawalAddress,
);
router.get(
  "/get-user-completed-products/:userId",
  user_controllers.getUserCompletedProducts,
);
router.get(
  "/get-user-uncompleted-products/:userId",
  user_controllers.getUserUnCompletedProducts,
);
router.patch("/update-score/:userId", user_controllers.updateScore);
router.patch("/update-level/:userId", user_controllers.updateLevel);
router.patch("/add-cashback/:userId", user_controllers.addCashback);
router.patch("/reset-cashback/:userId", user_controllers.resetCashback);
router.patch(
  "/udpate-freeze-withdraw/:userId",
  user_controllers.udpateFreezeWithdraw,
);
router.get(
  "/get-user-withdraw-address/:userId",
  user_controllers.getUserWithdrawAddress,
);
router.patch(
  "/update-withdraw-password/:userId",
  user_controllers.updateWithdrawPassword,
);
router.patch("/add-bonus-reward/:userId", user_controllers.addBonusReward);
router.get("/add-bonus-reward/:userId", user_controllers.addBonusReward);
router.get("/get-superior-user-recharge-withdraw", user_controllers.getSuperiorUserRechargeAndWithdraw);
router.get("/get-platform-recharge-withdraw", user_controllers.getPlatformRechargeAndWithdrawFromSuperiorData);

router.patch(
  "/update-password-from-admin/:userId",
  user_controllers.updatePasswordFromAdmin,
);

router.post("/spin/:userId", user_controllers.spinWheelService);
router.get("/spin/status/:userId", user_controllers.getWheelStatusService);


export const userRoute = router;
