function Person({id, chatId, socketId, name, online}) {
  this.id = id;
  this.chatId = chatId;
  this.socketId = socketId;
  this.name = name;
  this.online = online;
}

const users = (items) => {
  return items.map(item => new Person(item))
};
module.exports = users; 
