// Controllers               // MVC pattern
const Post = require("../Models/post");
const { validationResult } = require("express-validator");
const { formatISO9075 } = require("date-fns");
const fileDelete = require("../util/fileDelete");
const pdf = require("pdf-creator-node");
const expath = require("path");
const fs = require("fs");

exports.createPost = (req, res, next) => {
  const { title, description } = req.body;
  const img = req.file;
  const error = validationResult(req);
  if (img === undefined) {
    return res.status(422).render("AddPost", {
      title: "Add Post",
      errorMsg: "Image file must be jpg,png,jpeg",
      oldForm: { title, description },
    });
  }
  if (!error.isEmpty()) {
    return res.status(422).render("AddPost", {
      title: "Add Post",
      errorMsg: error.array()[0].msg,
      oldForm: { title, description },
    });
  }
  Post.create({ title, description, image: img.path, userId: req.user }) // auto fill userId with userid
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.renderCreatePags = (req, res) => {
  res.render("AddPost", {
    title: "Add Post",
    oldForm: { title: "", description: "", image: "" },
    errorMsg: "",
  }); // ejs rendering
};

let post_page = 4;
let totalPostNumber;

exports.renderHomPages = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  Post.find()
    .countDocuments()
    .then((totoalPostCount) => {
      totalPostNumber = totoalPostCount;
      return Post.find()
        .select("title description image") // select what we only need in final result
        .populate("userId", "email isPremium username profile_imgUrl") // this is communicate with user
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * post_page) // auto generate skip // => 2-1 = 1 * 3 = 3 skip
        .limit(post_page);
    })
    .then((posts) => {
      if (posts.length > 0) {
        return res.render("Home", {
          title: "Home Pages",
          postArray: posts,
          user: req.session.userInfo ? req.session.userInfo.email : "",
          currentPage: pageNumber,
          hasnextPage: post_page * pageNumber < totalPostNumber,
          haspreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
          currnetUserId: req.session.userInfo ? req.session.userInfo._id : "",
        }); // ejs rendering
      } else {
        return res.render("error/500.ejs", {
          title: "Something went wrong",
          err: "Page not found.",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.renderPostPages = (req, res) => {
  res.render("Post", { title: "Post" }); // ejs rendering
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postID;
  const isPremium = req.user && req.user.isPremium;
  Post.findById(postId)
    .populate("userId", "email")
    .then((post) => {
      res.render("details", {
        title: "Post Detail",
        post,
        isPremium,
        date: post.createdAt
          ? formatISO9075(post.createdAt, { representation: "date" })
          : undefined,
        currentUserId: req.session.userInfo ? req.session.userInfo._id : "",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.getOldPost = (req, res, next) => {
  const id = req.params.id;
  Post.findById(id)
    .then((post) => {
      res.render("Edit", {
        title: "Edit Post",
        errorMsg: "",
        post,
        id: "",
        oldForm: { title: "", description: "", image: "" },
        validation: true,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.editPost = (req, res, next) => {
  const { title, description, id } = req.body;
  const img = req.file;
  const error = validationResult(req);
  // if (img === undefined) {
  //   return res.status(422).render("Edit", {
  //     title: "Edit Post",
  //     errorMsg: "Image file must be jpg,png,jpeg",
  //     oldForm: { title, description },
  //     validation: false,
  //   });
  // }

  if (!error.isEmpty()) {
    return res.render("Edit", {
      title: "Edit Post",
      errorMsg: error.array()[0].msg,
      oldForm: { title, description },
      validation: false,
      id,
    });
  }

  Post.findById(id)
    .then((post) => {
      post.title = title;
      post.description = description;
      if (img) {
        fileDelete(post.image);
        post.image = img.path;
      }
      return post.save().then((result) => {
        res.redirect("/");
      });
    })

    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.deletePost = (req, res, next) => {
  const id = req.params.id;
  Post.findById(id)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      fileDelete(post.image);
      return Post.deleteOne({ _id: id, userId: req.user._id });
    })
    .then((post) => {
      console.log(post);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.savePost = (req, res, next) => {
  const id = req.params.id;
  // Read HTML Template
  const templateUrl = `${expath.join(
    __dirname,
    "../Pages/template/template.html"
  )}`;
  const html = fs.readFileSync(templateUrl, "utf8");
  const options = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    timeout: "10000",
    header: {
      height: "20mm",
      contents: '<div style="text-align: center;">PDF Download</div>',
    },
    footer: {
      height: "15mm",
      first: "Cover page",
      contents:
        '<span style="color: #444; text-align: center;">@fredy.code</span>',
    },
  };
  Post.findById(id)
    .populate("userId", "email")
    .lean()
    .then((user) => {
      const date = new Date();
      const pdfSaver = `${expath.join(
        __dirname,
        "../public/pdf",
        date.getTime() + ".pdf"
      )}`;

      const document = {
        html,
        data: {
          user,
        },
        path: pdfSaver,
        type: "",
      };

      pdf
        .create(document, options)
        .then((result) => {
          res.download(pdfSaver, (err) => {
            if (err) throw err;
            fileDelete(pdfSaver);
          });
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};
