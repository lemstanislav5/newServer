const {
  getMessages,
  addMessage,
  read,
  findMessege,
 } = require('../services/dataBase');

class MessegesController {
  async get(){
    const messeges = await getMessages();
    log(__filename, 'Получены сообщения пользователей');
    table(messeges);
    return messeges;
  }
  //from, to, messageId, text, time, type, read
  async add(fromId, toId, messageId, text, time, type){
    const read = 0;
    const message = await addMessage(fromId, toId, messageId, text, time, type, read);
    log(__filename, 'Сообщение добавлено в базу');
    table(message);
  }
  async find(messageId){
    const message = await findMessege(messageId);
    log(__filename, 'Поиск сообщения', {message});
    return message;
  }
  async read(currentUser){
    await read(currentUser);
    log(__filename, 'Прочитаны сообщения по чату: ', currentUser);
  }
}

module.exports = new MessegesController();
