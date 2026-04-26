import { Router } from "express";
import { user_controllers } from "./user.controller";

const router = Router();

router.post("/create", user_controllers.createUser);
router.get("/getAll", user_controllers.getAllUsers);
router.get("/getSingle/:userId", user_controllers.getUserByUserId);
router.patch("/update/:userId", user_controllers.updateUser);
router.delete("/delete/:userId", user_controllers.deleteUser);

router.put("/recharge/:userId", user_controllers.rechargeUserBalance);

router.put("/decrease/:userId", user_controllers.decreaseUserBalance);
// user.route.ts



router.patch(
  "/update-withdrawal-address/:userId",
  user_controllers.updateWithdrawalAddress,
);





router.patch(
  "/update-password-from-admin/:userId",
  user_controllers.updatePasswordFromAdmin,
);

router.post("/assignProducts", user_controllers.assignProducts);

router.post("/buyProduct", user_controllers.buyProduct);

router.patch('/updateIsgroupOrderAccepted/:selectedProductsIds', user_controllers.updateIsgroupOrderAccepted)

export const userRoute = router;
