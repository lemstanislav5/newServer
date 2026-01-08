const {
  getSetingsSocketUser,
  getSetingsConsentUser,
  getSetingsColorsUser,
  getSetingQuestionsUser,
  getSetingsContactsUser,
  setSetingsColorsUser,
  setSetingsSocketUser,
  setSetingsConsentUser,
  setSetingQuestionsUser,
  delSetingQuestionsUser,
  delSetingContactsUser,
  setSetingContactsUser,
 } = require('../services/dataBase');

class SetingsController {
  async get(){
    const toArr = (obj) => {
      const arr = [];
        for (var key in obj[0]) {
          if (obj[0].hasOwnProperty(key) && key !== 'id') arr.push([key, obj[0][key]]);
        }
      return arr;
    }
    const colors = await getSetingsColorsUser();
    const socket = await getSetingsSocketUser();
    const consent = await getSetingsConsentUser();
    const setings = {
      socket: socket[0],
      consent: consent[0],
      colors: colors[0],
      questions: await getSetingQuestionsUser(),
      contacts: await getSetingsContactsUser(),
    }
    log(__filename, 'Настройки пользователя');
    table(await getSetingQuestionsUser());
    return setings;
  }
  async set(data){
    const {colors, socket, consent, questions, contacts} = data;
    if (socket !== false) await setSetingsSocketUser(socket);
    if (consent !== false) await setSetingsConsentUser(consent);
    if (colors !== false) await setSetingsColorsUser(colors);
    if (questions !== false) {
      await delSetingQuestionsUser();
      questions.forEach(async item => await setSetingQuestionsUser(item));
    }
    if (contacts !== false) {
      await delSetingContactsUser();
      contacts.forEach(async item => await setSetingContactsUser(item));
    }
    //colors: colorsVal, socket: socketVal, consent: consentVal, questions: questionsVal, contacts: contactsVal
    // log(__filename, 'set', colors);
    // table(socket);
  }
}

module.exports = new SetingsController();
