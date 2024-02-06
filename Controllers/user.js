const post = require("../Models/post");
const Post = require("../Models/post");
const { validationResult } = require("express-validator");
const User = require("../Models/user");
const stripe = require("stripe")(
  "sk_test_51OZryPHOZu1Ie1IHv43YQkrRWTx18QaoEZSUSg2f13qCWjh1Ay9R31E9CFdL6GWubnVFOggr0ilB1XzeW6BcCgDi00aIR1saBW"
);

exports.userProfile = (req, res) => {
  const pageNumber = +req.query.page || 1;
  let totalPostNumber;
  let post_page = 4;

  Post.find({ userId: req.user._id })
    .countDocuments()
    .then((totoalPostCount) => {
      totalPostNumber = totoalPostCount;
      return Post.find({ userId: req.user._id })
        .populate("userId", "email username isPremium profile_imgUrl")
        .skip((pageNumber - 1) * post_page)
        .limit(post_page)
        .sort({ createdAt: -1 });
    })
    .then((posts) => {
      if (!posts.length > 0 && pageNumber > 1) {
        return res.render("error/500.ejs", {
          title: "Something went wrong",
          err: "Page not found.",
        });
      } else {
        res.render("../Pages/user/user.ejs", {
          title: req.session.userInfo.email,
          postArray: posts,
          user: req.session.userInfo ? req.session.userInfo.email : "",
          currentPage: pageNumber,
          hasnextPage: post_page * pageNumber < totalPostNumber,
          haspreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
          userEmail: req.session.userInfo ? req.session.userInfo.email : "",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.userPublicProfile = (req, res) => {
  const id = req.params.id;
  const pageNumber = +req.query.page || 1;
  let totalPostNumber;
  let post_page = 4;

  Post.find({ userId: id })
    .countDocuments()
    .then((totoalPostCount) => {
      totalPostNumber = totoalPostCount;
      return Post.find({ userId: id })
        .populate("userId", "email username isPremium profile_imgUrl")
        .skip((pageNumber - 1) * post_page)
        .limit(post_page)
        .sort({ createdAt: -1 });
    })
    .then((posts) => {
      if (posts.length > 0) {
        res.render("../Pages/user/public-profile.ejs", {
          title: posts[0].userId.email,
          postArray: posts,
          user: req.session.userInfo ? req.session.userInfo.email : "",
          currentPage: pageNumber,
          hasnextPage: post_page * pageNumber < totalPostNumber,
          haspreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
          id: posts[0].userId._id,
          userEmail: req.session.userInfo ? req.session.userInfo.email : "",
        });
      } else {
        return res.render("error/500.ejs", {
          title: "Something went wrong",
          err: "Page not found.",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.setUserName = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("../Pages/user/username.ejs", {
    title: "Change Name",
    error: "",
    oldForm: { usename: "" },
  });
};

exports.changeUserName = (req, res, next) => {
  const { username } = req.body;
  const updatedUserName = username.replace("@", "");
  const error = validationResult(req);
  // console.log(error);
  if (!error.isEmpty()) {
    return res.render("../Pages/user/username.ejs", {
      title: "Change Name",
      error: error.array()[0].msg,
      oldForm: { username },
    });
  }
  User.findById({ _id: req.user._id })
    .then((user) => {
      user.username = `@${updatedUserName}`;
      return user.save();
    })
    .then(() => {
      console.log("username updated sucessfully.");
      res.redirect("/admin/profile");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("User not found.");
      return next(error);
    });
};

exports.premiumPage = (req, res, next) => {
  stripe.checkout.sessions
    .create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1OZv09HOZu1Ie1IHP0e21PWH",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/admin/subscription-success?session_id={CHECKOUT_SESSION_ID}`, // default(ID)
      cancel_url: `${req.protocol}://${req.get(
        "host"
      )}/admin/subscription-cancel`,
    })
    .then((stripe_session) => {
      res.render("../Pages/user/premium.ejs", {
        title: "Premium Page",
        session_id: stripe_session.id,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.getsuccessfullPage = (req, res, next) => {
  const session_Id = req.query.session_id;
  if (!session_Id || !session_Id.includes("cs_test")) {
    return res.redirect("/admin/profile");
  }
  User.findById({ _id: req.user._id })
    .then((user) => {
      user.isPremium = true;
      user.payment_session_key = session_Id;
      return user.save();
    })
    .then(() => {
      res.render("../Pages/user/subscription.ejs", {
        title: "Successfull",
        subscription_id: session_Id,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.premiumDetail = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      return stripe.checkout.sessions.retrieve(user.payment_session_key);
    })
    .then((stripe_session) => {
      res.render("../Pages/user/premium-detail.ejs", {
        title: "Premium Detail",
        customer_id: stripe_session.customer,
        country: stripe_session.customer_details.address.city,
        postal_code: stripe_session.customer_details.address.postal_code,
        email: stripe_session.customer_details.email,
        name: stripe_session.customer_details.name,
        invoice_id: stripe_session.invoice,
        status: stripe_session.payment_status,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.cancelPage = (req, res) => {
  res.redirect("/admin/premium");
};

exports.profilePhotoPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("../Pages/user/profile-upload.ejs", {
    title: "Upload Profile",
    error: message,
  });
};

exports.getUploadUerPhoto = (req, res) => {
  const image = req.file;
  console.log("image => ", image);
  const error = validationResult(req);
  if (image === undefined) {
    return res.status(422).render("../Pages/user/profile-upload.ejs", {
      title: "Upload Profile",
      error: "Image must be jpg,png,jpeg.",
    });
  }
  if (!error.isEmpty()) {
    return res.status(422).render("../Pages/user/profile-upload.ejs", {
      title: "Upload Profile",
      error: error[0].msg,
    });
  }
  User.findById(req.user._id)
    .then((user) => {
      user.profile_imgUrl = image.path;
      return user.save();
    })
    .then(() => {
      res.redirect("/admin/profile");
    })
    .catch((err) => {
      console.log(err);
    });
};
