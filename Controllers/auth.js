const User = require("../Models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

// render login pages
exports.getLoginPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("../Pages/auth/login", {
    title: "Login Pages",
    csrfToken: req.csrfToken(),
    error: message,
    oldForm: { email: "", password: "" },
  });
};
// handle login
exports.postLoginData = (req, res) => {
  const { email, password } = req.body;
  const error = validationResult(req);
  // console.log(error);
  if (!error.isEmpty()) {
    return res.render("../Pages/auth/login", {
      title: "Login Pages",
      error: error.array()[0].msg,
      oldForm: { email: email, password: password },
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.render("../Pages/auth/login", {
          title: "Login Pages",
          error: "Please enter a valid email and password",
          oldForm: { email: email, password: password },
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          // compare result booelan
          if (isMatch) {
            req.session.isLogin = true;
            req.session.userInfo = user;
            return req.session.save((err) => {
              // it will wait the finish of it infront of function
              res.redirect("/");
              console.log(err);
            });
          }
          return res.render("../Pages/auth/login", {
            title: "Login Pages",
            error: "Please enter a valid password",
            oldForm: { email: email, password: password },
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
// handle logout
exports.logOut = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

// render feedback page
exports.renderFeedbackPage = (req, res) => {
  res.render("../Pages/auth/feedback.ejs", {
    title: "Feedback Page",
  });
};

// render register page
exports.registerPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("../Pages/auth/register", {
    title: "Register Page",
    errorMsg: message,
    oldForm: { email: "", password: "" },
  });
};

// handle register
exports.registerAccount = (req, res) => {
  const { email, password } = req.body;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).render("../Pages/auth/register", {
      title: "Register Page",
      errorMsg: error.array()[0].msg,
      oldForm: { email: email, password: password },
    });
  }
  User.findOne({ email: email }) // validation checking
    .then((user) => {
      if (user) {
        req.flash("error", "Email is alredy existed.");
        return res.redirect("/register");
      }
      return bcrypt // change password to unique keys
        .hash(password, 10)
        .then((haspwd) => {
          return User.create({
            email: email,
            password: haspwd,
          });
        })
        .then((_) => {
          res.redirect("/login");
          transporter.sendMail(
            {
              from: process.env.SENDER_MAIL,
              to: email,
              subject: "Register Sucessfully.",
              html: "<h2>Register account sucessfully.</h2><p>You created account using this email.</p>",
            },
            (err) => {
              console.log(err);
            }
          );
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

// reset password page render
exports.forgetPassword = (req, res) => {
  let message = req.flash("err");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("../Pages/auth/reset", { title: "Reset Page", errorMsg: message });
};

// reset form handler
exports.handleResetForm = (req, res) => {
  const { email } = req.body;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.render("../Pages/auth/reset", {
      title: "Reset Page",
      errorMsg: error.array()[0].msg,
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          console.log("helo fromuser");
          return res.render("../Pages/auth/reset", {
            title: "Reset Page",
            errorMsg: "Can't find an account with this email",
          });
        }
        user.resetToken = token;
        user.tokenExpiration = Date.now() + 900000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/feedback");
        transporter.sendMail({
          from: process.env.SENDER_MAIL,
          to: email,
          subject: "Reset Password",
          html: `<h2>Reset password</h2><p>Reset your password</p><a href="http://localhost:8080/forget_password/${token}">Click to change password</a>`,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

// render new password pages
exports.newPasswordPage = (req, res) => {
  const { token } = req.params;
  User.findOne({ resetToken: token, tokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      console.log(user);
      let message = req.flash("err");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("../Pages/auth/new-pass.ejs", {
        title: "New Password",
        errorMsg: message,
        resetToken: token,
        user_id: user._id,
        oldForm: { password: "", confirm_password: "" },
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// for new password //

exports.changeNewPassword = (req, res) => {
  const { password, confirm_password, resetToken, user_id } = req.body;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).render("../Pages/auth/new-pass.ejs", {
      title: "New Password",
      errorMsg: error.array()[0].msg,
      resetToken,
      user_id,
      oldForm: { password, confirm_password },
    });
  }
  let resetUser;
  User.findOne({
    resetToken: resetToken,
    tokenExpiration: { $gt: Date.now() },
    _id: user_id,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(password, 10);
    })
    .then((hashPass) => {
      resetUser.password = hashPass;
      resetUser.tokenExpiration = undefined;
      resetUser.resetToken = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};
