const express = require("express");
const path = require("path");
const postRouter = require("./Routers/Post");
const { adminPost } = require("./Routers/Admin");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authRouter = require("./Routers/Auth");
const User = require("./Models/user");
const dotenv = require("dotenv");
dotenv.config();
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const { Login } = require("./middleware/isLogin");
const csrf = require("csurf");
const flash = require("connect-flash");

// for server
const app = express();

// error import
const errorController = require("./Controllers/error");
const multer = require("multer");

// filter pass or skipped
const filterConfigure = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// to store file
const storageConfigure = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// to protect for middleware
const csrfProtect = csrf();

//to store session
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

// for ejs
app.set("view engine", "ejs");
app.set("views", "Pages");

// for public released
app.use(express.static(path.join(__dirname, "./public")));
app.use("/images", express.static(path.join(__dirname, "./images")));

// for body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: storageConfigure, fileFilter: filterConfigure }).single(
    "image"
  )
);

// to store cookie in mongodb
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false, // we need only one time cookie so we use false
    saveUninitialized: false,
    store: store, // key value same so use es6 to store in mongodb
  })
);
app.use(csrfProtect);
app.use(flash());

// for user middleware
app.use((req, res, next) => {
  if (req.session.isLogin === undefined) {
    return next();
  }
  User.findById(req.session.userInfo._id)
    .select("_id email isPremium")
    .then((user) => {
      req.user = user;
      next();
    });
});

app.use((req, res, next) => {
  res.locals.isLogin = req.session.isLogin ? true : false;
  res.locals.csrfToken = req.csrfToken(); // auto generate tokenkey
  next();
});

// route middleware
app.use("/admin", Login, adminPost);
app.use(postRouter);
app.use(authRouter);

// error
app.all("*", errorController.error404);

app.use(errorController.error500);

// connected to server database
mongoose // using mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to mongodb");
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
