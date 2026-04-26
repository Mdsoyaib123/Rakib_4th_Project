import { AppError } from "../../utils/app_error";
import { TAccount, TLoginPayload, TRegisterPayload } from "./auth.interface";
import { Account_Model } from "./auth.schema";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { TUser } from "../user/user.interface";
import { User_Model } from "../user/user.schema";
import { jwtHelpers } from "../../utils/JWT";
import { configs } from "../../configs";
import { JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../../utils/mail_sender";

const login_user_from_db = async (
  payload: TLoginPayload,
  ipAddress: string,
) => {
  const isExistAccount = await User_Model.findOne({
    phoneNumber: payload.phoneNumber,
  });
  // console.log("is account", isExistAccount);
  if (!isExistAccount) {
    throw new AppError("Account is   Not Found", httpStatus.NOT_FOUND);
  }
 

  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    isExistAccount.password,
  );

  if (!isPasswordMatch) {
    throw new AppError("Invalid password", httpStatus.UNAUTHORIZED);
  }

  const accessToken = jwtHelpers.generateToken(
    {
      phoneNumber: isExistAccount.phoneNumber,
      role: isExistAccount.role,
      userId: isExistAccount.userId,
    },
    configs.jwt.access_token_secret as Secret,
    configs.jwt.access_token_expires as string,
  );

  // console.log("accessToken", accessToken);

  const refreshToken = jwtHelpers.generateToken(
    {
      phoneNumber: isExistAccount.phoneNumber,
      role: isExistAccount.role,
      userId: isExistAccount.userId,
    },
    configs.jwt.refresh_token_secret as Secret,
    configs.jwt.refresh_token_expires as string,
  );
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    role: isExistAccount.role,
    userId: isExistAccount.userId,
    user_id: isExistAccount._id,
  };
};

const get_my_profile_from_db = async (phoneNumber: string) => {
  const accountProfile = await User_Model.findOne({
    phoneNumber: phoneNumber,
  });

  return {
    profile: accountProfile,
  };
};

const refresh_token_from_db = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      configs.jwt.refresh_token_secret as Secret,
    );
  } catch (err) {
    throw new Error("You are not authorized!");
  }

  const userData = await User_Model.findOne({
    phoneNumber: decodedData.phoneNumber,
  });

  const accessToken = jwtHelpers.generateToken(
    {
      phoneNumber: userData!.phoneNumber,
      role: userData!.role,
    },
    configs.jwt.access_token_secret as Secret,
    configs.jwt.access_token_expires as string,
  );

  return { accessToken };
};

const change_password_from_db = async (
  user: JwtPayload,
  payload: {
    oldPassword: string;
    newPassword: string;
  },
) => {
  const isExistAccount = await User_Model.findOne({
    phoneNumber: user.phoneNumber,
  });
  if (!isExistAccount) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    isExistAccount.password,
  );
  if (!isCorrectPassword) {
    throw new AppError("Old password is incorrect", httpStatus.UNAUTHORIZED);
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 10);
  await User_Model.findOneAndUpdate(
    { phoneNumber: isExistAccount.phoneNumber },
    {
      password: hashedPassword,
    },
  );
  return "Password changed successful.";
};

// const forget_password_from_db = async (email: string) => {
//   const isAccountExists = await User_Model.findOne({ email: email });
//   if (!isAccountExists) {
//     throw new AppError("Account not found", httpStatus.NOT_FOUND);
//   }
//   const resetToken = jwtHelpers.generateToken(
//     {
//       email: isAccountExists.email,
//       role: isAccountExists.role,
//     },
//     configs.jwt.reset_secret as Secret,
//     configs.jwt.reset_expires as string,
//   );

//   const resetPasswordLink = `${configs.jwt.front_end_url}/reset?token=${resetToken}&email=${isAccountExists.email}`;
//   const emailTemplate = `<p>Click the link below to reset your password:</p><a href="${resetPasswordLink}">Reset Password</a>`;

//   await sendMail({
//     to: email,
//     subject: "Password reset successful!",
//     textBody: "Your password is successfully reset.",
//     htmlBody: emailTemplate,
//   });

//   return "Check your email for reset link";
// };

// const reset_password_into_db = async (
//   token: string,
//   email: string,
//   newPassword: string,
// ) => {
//   let decodedData: JwtPayload;
//   try {
//     decodedData = jwtHelpers.verifyToken(
//       token,
//       configs.jwt.reset_secret as Secret,
//     );
//   } catch (err) {
//     throw new AppError(
//       "Your reset link is expire. Submit new link request!!",
//       httpStatus.UNAUTHORIZED,
//     );
//   }

//   const isAccountExists = await User_Model.findOne({
//     email: decodedData.email,
//   });
//   if (!isAccountExists) {
//     throw new AppError("Account not found", httpStatus.NOT_FOUND);
//   }

//   const hashedPassword: string = await bcrypt.hash(newPassword, 10);

//   await Account_Model.findOneAndUpdate(
//     { email: isAccountExists.email },
//     {
//       password: hashedPassword,
//       lastPasswordChange: Date(),
//     },
//   );
//   return "Password reset successfully!";
// };

// const verified_account_into_db = async (token: string) => {
//   try {
//     const { email } = jwtHelpers.verifyToken(
//       token,
//       configs.jwt.verified_token as string,
//     );
//     // check account is already verified or blocked
//     const isExistAccount = await Account_Model.findOne({ email });
//     // check account
//     if (!isExistAccount) {
//       throw new AppError("Account not found!!", httpStatus.NOT_FOUND);
//     }
//     if (isExistAccount.isDeleted) {
//       throw new AppError("Account deleted !!", httpStatus.BAD_REQUEST);
//     }
//     const result = await Account_Model.findOneAndUpdate(
//       { email },
//       { isVerified: true },
//       { new: true },
//     );

//     return result;
//   } catch (error) {
//     throw new AppError("Invalid or Expired token!!!", httpStatus.BAD_REQUEST);
//   }
// };

// const get_new_verification_link_from_db = async (email: string) => {
//   const isExistAccount = await User_Model.findOne({ email });
//   // check account
//   if (!isExistAccount) {
//     throw new AppError("Account not found!!", httpStatus.NOT_FOUND);
//   }

//   const verifiedToken = jwtHelpers.generateToken(
//     {
//       email,
//     },
//     configs.jwt.verified_token as Secret,
//     "5m",
//   );
//   const verificationLink = `${configs.jwt.front_end_url}/verified?token=${verifiedToken}`;
//   await sendMail({
//     to: email,
//     subject: "New Verification link",
//     textBody: `New Account verification link is successfully created on ${new Date().toLocaleDateString()}`,
//     htmlBody: `
//             <p>Thanks for creating an account with us. We’re excited to have you on board! Click the button below to
//                 verify your email and activate your account:</p>


//             <div style="text-align: center; margin: 30px 0;">
//                 <a href="${verificationLink}" target="_blank"
//                     style="background-color: #4CAF50; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; font-size: 18px;"
//                     class="btn">
//                     Verify My Email
//                 </a>
//             </div>

//             <p>If you did not create this account, please ignore this email.</p>
//             `,
//   });

//   return null;
// };

export const auth_services = {
  login_user_from_db,
  get_my_profile_from_db,
  refresh_token_from_db,
  change_password_from_db,
  // forget_password_from_db,
  // reset_password_into_db,
  // verified_account_into_db,
  // get_new_verification_link_from_db,
};
