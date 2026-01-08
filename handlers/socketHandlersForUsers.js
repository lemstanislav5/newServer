const fs = require("fs"),
      Utilities = require('../utilities/utilities'),
      process = require('process'),
      {v4: uuidv4} = require('uuid'),
      MessegesController = require("../controllers/MessegesController"),
      UsersController = require('../controllers/UsersController'),
      ManagerController = require('../controllers/AdminController'),
      SetingsController = require('../controllers/SetingsController'),
      { table } = require("console");

module.exports = {
  connection: async (socket) => {
    socket.on('online', async (chatId, callback) => {
      let checkСhatId, addUser, checkSocket, updateSocketId;
      checkСhatId = await UsersController.checkСhatId(socket, chatId);
      if (!checkСhatId) addUser = await UsersController.addUser(socket, chatId);
      checkSocket = await UsersController.checkSocket(socket.id, chatId);
      if (!checkSocket) updateSocketId = await UsersController.updateSocketId(socket, chatId);
      if(checkСhatId || addUser) {
        UsersController.online(chatId);
        let  {id, socketId} = await ManagerController.get();
        if (socketId === null) callback(false); //АДМИН НЕ ПОДКЛЮЧЕН К СОКЕТУ
        if(id && socketId) {
          io.to(socketId).emit('online', chatId);
          const users = await UsersController.get();
          io.to(socketId).emit('getUsers', users);
        }
      }
      return callback(true);
    });

    socket.on('newMessage', async ({fromId, text, time, type}, callback) => {
      const toId = 'admin', messegeId = uuidv4();
      await MessegesController.add(fromId, toId, messegeId, text, time, type);
      let message = await MessegesController.find(messegeId);
      const {socketId} = await ManagerController.get();
      if(socketId === undefined) callback({error: false})
      io.to(socketId).emit('newMessage', message[0]);
      log(__filename, 'Сообщение направлено администратору');
      table(message);
      return callback(message[0]);
    });

    socket.on('introduce', async ({chatId, name, email}, callback) => {
      const text = `Пользователь представился как: ${name} ${email}`;
      const toId = 'admin', messegeId = uuidv4(), fromId = chatId;
      await UsersController.introduce(name, email, fromId);
      await MessegesController.add(fromId, toId, messegeId, text, time = new Date().getTime(), type = 'text', read = 0);
      const message = await MessegesController.find(messegeId);
      const {socketId} = await ManagerController.get();
      log(__filename, 'socketId', socketId);
      if(socketId === undefined) callback(false)
      io.to(socketId).emit('newMessage', message[0]);
      io.to(socketId).emit('introduce', {fromId, name, email});
      return callback(message[0]);
    });

    socket.on('upload', async (file, {fromId, time, type}, callback) => {
      let dir = process.cwd() + '/media/' + type;
      await Utilities.checkDirectory(dir, fs);
      const fileName = new Date().getTime();
      const text = 'http://' + process.env.HOST + ':' + process.env.PORT + '/api/media/' + type + '/' + fileName + '.' + type;
      fs.writeFile(dir + '/' + fileName + '.' + type, file, async (err) => {
        const toId = 'admin', messegeId = uuidv4();
        await MessegesController.add(fromId, toId, messegeId, text, time, type);
        let message = await MessegesController.find(messegeId);
        const {socketId} = await ManagerController.get();
        console.log(socketId)
        if (err || socketId === null && socketId === undefined) return callback(false);
        io.to(socketId).emit('upload', message[0]);
        log(__filename, 'Файл отправлен администратору администратору', socketId);
        return callback(message[0]);
      })
    });

    socket.on('disconnect', async () => {
      evant(__filename, 'D I S C O N N E C T');
      const user = await UsersController.findBySocketId(socket.id);
      if (user !== undefined) {
        const chatId = user.chatId;
        log(__filename, 'Пользователь отсоединился', user);
        await UsersController.offline(chatId);
        let  {id, socketId} = await ManagerController.get();
        if (socketId === null) return null; //МЕНЕДЖЕР НЕ ПОДКЛЮЧЕН К СОКЕТУ
        if (socketId && chatId) io.to(socketId).emit('offline', chatId);
      } else {
        log(__filename, 'Пользователь отсоединился', 'сокет в базе не найден, статус не изменен!!!');
      }
    });

    socket.on('getSetings', async callback => {
      let setings = await SetingsController.get();
      return callback(setings);
    });
  }
}
