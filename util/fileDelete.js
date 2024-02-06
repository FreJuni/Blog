const fs = require("fs");

// to delete file
const fileDelete = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) throw err;
    console.log("image was deleted");
  });
};

module.exports = fileDelete;
