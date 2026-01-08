const jwt = require('jsonwebtoken'),
fs = require("fs"),
Utilities = require('../utilities/utilities'),
process = require('process'),
{v4: uuidv4} = require('uuid'),
users = require("../utilities/users");
SECRET_KEY = process.env.PRIVATE_KEY;

const ManagerController = require('../controllers/AdminController');
const MessegesController = require('../controllers/MessegesController');
const UsersController = require('../controllers/UsersController');
const SetingsController = require('../controllers/SetingsController');

module.exports = {
  authentication: (socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token){
      jwt.verify(socket.handshake.query.token, SECRET_KEY, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.authentication = true;
        socket.decoded = decoded;
        next();
      });
    } else if (socket.handshake.query && socket.handshake.query.token === undefined){
      socket.authentication = false;
      next();
    } else {
      next(new Error('Аутентификация провалина!'));
    }
  },
  connection: async (socket) => {
    await ManagerController.updateSocketId(socket.id);

    socket.on('getUsers', async (callback) => {
      const users = await UsersController.get();
      callback(users);
    });
    socket.on('getMesseges', async (callback) => {
      const messeges = await MessegesController.get();
      callback(messeges);
    });
    socket.on('read', async ({currentUser}, callback) => {
      const read = await MessegesController.read(currentUser);
      callback(currentUser);
    });

    socket.on('newMessage', async ({toId, text, time, type}, callback) => {
      const fromId = 'admin', messegeId = uuidv4();
      await MessegesController.add(fromId, toId, messegeId, text, time, type);
      let message = await MessegesController.find(messegeId);
      const socketId = await UsersController.getUserSocketId(toId);
      io.to(socketId).emit('newMessage', message[0]);
      return callback(message[0]);
    });

    socket.on("upload", async (file, {toId, time, type}, callback) => {
      console.log(toId, time, type)
      let dir = process.cwd() + '/media/' + type;
      await Utilities.checkDirectory(dir, fs);
      const fileName = new Date().getTime();
      const text = 'http://' + process.env.HOST + ':' + process.env.PORT + '/api/media/' + type + '/' + fileName + '.' + type;
      fs.writeFile(dir + '/' + fileName + '.' + type, file, async (err) => {
        const fromId = 'admin', messegeId = uuidv4();
        await MessegesController.add(fromId, toId, messegeId, text, time, type);
        let message = await MessegesController.find(messegeId);
        const socketId = await UsersController.getUserSocketId(toId);
        if (err) return callback(false);
        io.to(socketId).emit('newMessage', message[0]);
        return callback(message[0]);
      })
    });
    socket.on('disconnect', () => {
      log(__filename, 'disconnect', socket.id);
    });
    socket.on('getSetings', async callback => {
      let setings = await SetingsController.get();
      return callback(setings);
    });
    socket.on('setSetings', async ({data}, callback) => {
      await SetingsController.set(data);
      callback(true);
    });
  }
}
