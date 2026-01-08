const process = require('process');
const fs = require("fs");
const path = require('path');

module.exports = (req, res) => {
  try {
    let pathFile = path.join(process.cwd(), req.originalUrl).replace('/api', '').replace('\\api', '');;
    console.log(pathFile)
    if (fs.existsSync(pathFile)) {
      console.log(pathFile)
      return res.status(200).sendFile(pathFile);
    }
    return res.status(202).send();
  } catch(err) {
    console.error(err);
  }
}
