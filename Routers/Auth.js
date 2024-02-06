const express = require("express");
const authController = require("../Controllers/auth");
const { body } = require("express-validator");

const router = express.Router();

router.post(
  "/register",
  body("email").isEmail().withMessage("Please enter a valid email."),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must be atleast 4 charactor."),
  authController.registerAccount
);

router.get("/register", authController.registerPage);

router.get("/login", authController.getLoginPage);

router.post(
  "/login",
  body("email").isEmail().withMessage("Please enter a valid email.."),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Passowrd is not valid."),
  authController.postLoginData
);

router.post("/logout", authController.logOut);

router.post(
  "/reset",
  body("email").isEmail().withMessage("Please enter a valid email."),
  authController.handleResetForm
);

router.get("/reset-password", authController.forgetPassword);

router.get("/feedback", authController.renderFeedbackPage);

router.get("/forget_password/:token", authController.newPasswordPage);

router.post(
  "/change-new-password",
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must be atleast 4 charactor"),
  body("confirm_password")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password must be matched.");
      }
      return true;
    }),
  authController.changeNewPassword
);

module.exports = router;
