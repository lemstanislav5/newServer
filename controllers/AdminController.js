const {
  updateAdminSocketId,
  addAdmin,
  findAdmin,
  getAdmin,
 } = require('../services/dataBase');

class AdminController {
  async get() {
    let admin = await getAdmin();
    log(__filename, 'Получены данные менеджера');
    table(admin);
    return admin[0];
  }

  async accest(id) {
    await updateAdminAccest(id);
    log(__filename, 'Получены доступ менеджера', id);
  }
  async add(id){
    await addAdmin(id);
    log(__filename, 'Менеджер добавлен', id);
  }
  async find(id){
    log(__filename, 'Поиск менеджера', id);
    return await findAdmin(id);
  }
  async checkSocket(socket, id) {
    const admin = await findAdmin(id);
    log(__filename, 'Проверка socket.id менеджера', socket, id);
    return (Admin.length > 0 && admin[0].socketId !== socket.id) ? false: true;
  }
  async updateSocketId(SocketId){
    log(__filename, 'Сокет менеджера обновлен на', SocketId);
    updateAdminSocketId(SocketId);
  }
}

module.exports = new AdminController()
