const jwt = require("jsonwebtoken"),
  process = require("process"),
  SECRET_KEY = process.env.PRIVATE_KEY;
const ManagerController = require('../controllers/AdminController');

module.exports = {
  authentication: async (req, res, next) => {
    let manager = await ManagerController.get();
    if (manager != []) req.manager = manager;
    if (req.manager && req.headers.authorization) {
      let token = req.headers.authorization.split(" ")[1];
      if (token === "undefined") return next();
      jwt.verify(token, SECRET_KEY, (err, payload) => {
        if (err) console.error("authentication: token is not verified");
        //? Проверка соответствия идентификатора
        if (
          req.manager !== undefined &&
          payload !== undefined &&
          req.manager.id === payload.id
        ) {
          req.auth = true;
        }
      });
    }
    next();
  },
  messages: (req, res) => {
    if (req.auth) return res.status(200).send({ login: req.manager.login });
    return res.status(401).send();
  },
  authorization: (req, res) => {
    if (req.body.login === req.manager.login && req.body.password === req.manager.password) {
      // данные о пользователе
      const payload = { id: req.manager.id, login: req.manager.login };
      const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "14m" });
      const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "30d" });
      const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
        sameSite: "none",
      };
      res.cookie("refreshToken", refreshToken, cookieOptions);
      return res.status(200).json({
        token: accessToken,
        login: req.manager.login
      });
    }

    return res.status(404).json({ message: "User not found" });
  },
  refresh: (req, res) => {
    const inputRefreshToken = req.cookies.refreshToken;
    if (inputRefreshToken === undefined)
      return res
        .status(400)
        .json({ error: true, message: "refresh token is undefined" });
    jwt.verify(inputRefreshToken, SECRET_KEY, (err, tokenDetails) => {
      if (err)
        return res
          .status(400)
          .json({ error: true, message: "refresh token is not verified" });
      const payload = { id: tokenDetails.id, login: tokenDetails.login };
      const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "14m" });
      const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "30d" });
      const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
        sameSite: "none",
      };
      res.cookie("refreshToken", refreshToken, cookieOptions);
      console.log('accessToken администратора обновлен по refreshToken.')
      return res.status(200).json({
        payload,
        token: accessToken,
      });
    });
  },
  logout: (req, res) => {
    const inputRefreshToken = req.cookies.refreshToken;
    if (inputRefreshToken === undefined)
      return res
        .status(400)
        .json({ error: true, message: "refresh token is undefined" });
    jwt.verify(inputRefreshToken, SECRET_KEY, (err, tokenDetails) => {
      if (err)
        return res
          .status(400)
          .json({ error: true, message: "refresh token is not verified" });
      // данные о пользователе
      const payload = { id: tokenDetails.id, login: tokenDetails.login };
      const accessToken = undefined;
      const refreshToken = undefined;
      const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
        sameSite: "none",
      };
      res.cookie("refreshToken", refreshToken, cookieOptions);
      console.log('logout: пользователь  id: ' + tokenDetails.id + 'login: ' +  tokenDetails.login + ' вышел из сервиса.' )
      return res.status(200).json({token: accessToken});
    });
  }
};
