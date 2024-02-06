exports.error404 = (req, res) => {
  res.render("error/404.ejs", { title: "404" });
};
exports.error500 = (err, req, res, next) => {
  const errMsg = err.message;
  res.render("error/500.ejs", { title: "Something went wrong", err: errMsg });
};
