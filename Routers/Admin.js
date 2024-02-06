const express = require("express");
const { body, check } = require("express-validator");
const router = express.Router();
const postController = require("../Controllers/Post");
const userController = require("../Controllers/user");
const { Premium } = require("../middleware/isPremium");

router.get("/create-post", postController.renderCreatePags);

router.post(
  "/",
  body("title")
    .isLength({ min: 9 })
    .withMessage("Title must be atleast 9 charactor."),
  body("description")
    .isLength({ min: 30 })
    .withMessage("Description must be atleast 30 charactor."),
  postController.createPost
);

router.get("/edit-post/:id", postController.getOldPost);

router.post(
  "/edit",
  body("title")
    .isLength({ min: 9 })
    .withMessage("Title must be atleast 9 charactor."),
  body("description")
    .isLength({ min: 30 })
    .withMessage("Description must be atleast 30 charactor."),
  postController.editPost
);

router.post("/delete/:id", postController.deletePost);

router.get("/save/:id", Premium, postController.savePost);

router.get("/profile", userController.userProfile);

router.get("/set-username", userController.setUserName);

router.post(
  "/set_username",
  body("username")
    .isLength({ min: 5 })
    .withMessage("Username must be atleat 5 charactor."),
  userController.changeUserName
);

router.get("/premium", userController.premiumPage);

router.get("/subscription-success", userController.getsuccessfullPage);

router.get("/premium-detail", userController.premiumDetail);

router.get("/subscription-cancel", userController.cancelPage);

router.get("/profile_image", userController.profilePhotoPage);

router.post("/set_profile", Premium, userController.getUploadUerPhoto);

module.exports = { adminPost: router };
