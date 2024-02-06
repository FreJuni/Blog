const express = require("express");
const path = require("path");
const { posts } = require("./Admin");
const userController = require("../Controllers/user");

const router = express.Router();
const postController = require("../Controllers/Post");

router.get("/", postController.renderHomPages);

router.get("/post/:postID", postController.getPost);

router.get("/post", postController.renderPostPages);

router.get("/public-profile/:id", userController.userPublicProfile);

module.exports = router;
