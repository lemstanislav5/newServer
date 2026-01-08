/**
 * Основной принцип - избежать создания лишних сущностей (таблиц, объектов)
 * ?Нужно расмотреть вопрос о необходимости добавления в таблицу "users" полей phone и  email, либо создания отдельной таблицы?
 * ! При настройке портов в Ngin необходимо убрать строчку process.env.PORT из handlers_socketHandlersForUsers.js
 * ! Пользователь не видет прочитано или нет сообщение администратором, только добавление в базу и отправку менеджеру handlers_socketHandlersForUsers.js
*/
const sqlite3 = require('sqlite3').verbose();
const query = (file, req, sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(file, (err) => {
            if (err) return log(__filename, 'ОШИБКИ ПРИ ОТКРЫТИИ БАЗЫ ДАННЫХ', err);
        });
        db.serialize(() => db[req](sql, params,
            (err,res) => {
                if(err) {
                  log(__filename, 'ОШИБКА БАЗЫ ДАННЫХ', err);
                  return reject(err);
                }
                resolve(res);
            }
        ));
        db.close(err => {
            if (err) return log(__filename, 'ОШИБКИ ПРИ ЗАКРЫТИИ БАЗЫ ДАННЫХ', err);
        });
    })
}

module.exports = {
     /**
     * Инициализация базы данных и создание необходимых индексов
     */
    init: () => {
        return Promise.all([
            // Создание основных таблиц
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS setingsSocketUser (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT,
                    ws TEXT,
                    port TEXT
                )`),
            
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS setingsConsentUser (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    consentLink TEXT,
                    policyLink TEXT
                )`),
            
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS setingsColorsUser (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conteiner TEXT,
                    top TEXT,
                    messages TEXT,
                    fromId TEXT,
                    text TEXT,
                    notification TEXT,
                    toId TEXT
                )`),
            
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS setingsQuestionsUser (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question TEXT,
                    offOn INTEGER
                )`),
            
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS setingsContactsUser (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    socialNetwork TEXT,
                    link TEXT,
                    offOn INTEGER
                )`),
            

            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chatId TEXT NOT NULL,
                    socketId TEXT,
                    name TEXT,
                    email TEXT,
                    phone TEXT,
                    online INTEGER DEFAULT 0,
                    created_at INTEGER DEFAULT (strftime('%s', 'now'))
                )`),
            
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fromId TEXT NOT NULL,
                    toId TEXT NOT NULL,
                    messageId TEXT UNIQUE,
                    text TEXT NOT NULL,
                    time INTEGER NOT NULL,
                    type TEXT DEFAULT 'text',
                    is_read INTEGER DEFAULT 0
                )`),
            
            query('data.db3', 'run', `
                CREATE TABLE IF NOT EXISTS admin (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chatId TEXT UNIQUE NOT NULL,
                    socketId TEXT,
                    login TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )`)
        ])
        // Создание индексов для оптимизации запросов
        .then(() => Promise.all([
            // Индексы для таблицы users
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_users_chatId ON users(chatId)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_users_socketId ON users(socketId)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_users_online ON users(online)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at)'),
            
            // Индексы для таблицы messages (наиболее важные для производительности)
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_fromId ON messages(fromId)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_toId ON messages(toId)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_messageId ON messages(messageId)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_time ON messages(time)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)'),
            // Составной индекс для быстрого поиска диалогов
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_dialog ON messages(fromId, toId, time)'),
            // Составной индекс для поиска непрочитанных сообщений
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(toId, is_read) WHERE is_read = 0'),
            
            // Индексы для таблицы admin
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_admin_chatId ON admin(chatId)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_admin_login ON admin(login)'),
            
            // Индексы для таблиц настроек
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_questions_offOn ON setingsQuestionsUser(offOn)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_contacts_offOn ON setingsContactsUser(offOn)'),
            query('data.db3', 'run', 'CREATE INDEX IF NOT EXISTS idx_contacts_network ON setingsContactsUser(socialNetwork)')
        ]))
        // Заполнение начальными данными
        .then(() => query('data.db3', 'run', 
            'INSERT OR REPLACE INTO admin (id, chatId, login, password) VALUES (?, ?, ?, ?)', 
            [1, 'admin', '1', '1']))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsSocketUser (id, url, ws, port) VALUES (?, ?, ?, ?)',
            [1, 'localhost', 'ws', '4000']))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsConsentUser (id, consentLink, policyLink) VALUES (?, ?, ?)',
            [1, '', '']))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsColorsUser (id, conteiner, top, messages, fromId, text, notification, toId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [1, '#fff', '#fff', '#303245', '#2a306b', '#5f3288', '#333', '#5e785e']))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsQuestionsUser (id, question, offOn) VALUES (?, ?, ?)',
            [1, 'Здравствуйте!', 1]))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsContactsUser (id, socialNetwork, link, offOn) VALUES (?, ?, ?, ?)',
            [1, 'Telegram', 'https://Telegram.com', 1]))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsContactsUser (id, socialNetwork, link, offOn) VALUES (?, ?, ?, ?)',
            [2, 'VKontakte', 'https://VKontakte.com', 1]))
        .then(() => query('data.db3', 'run',
            'INSERT OR REPLACE INTO setingsContactsUser (id, socialNetwork, link, offOn) VALUES (?, ?, ?, ?)',
            [3, 'WhatsApp', 'https://WhatsApp.com', 1]));
    },
    //-----------------------------------setings-----------------------------------
    getSetingsSocketUser: () => (query('data.db3', 'all', 'SELECT * FROM setingsSocketUser', [])),
    getSetingsConsentUser: () => (query('data.db3', 'all', 'SELECT * FROM setingsConsentUser', [])),
    getSetingsColorsUser: () => (query('data.db3', 'all', 'SELECT * FROM setingsColorsUser', [])),
    getSetingQuestionsUser: () => (query('data.db3', 'all', 'SELECT * FROM setingsQuestionsUser', [])),
    getSetingsContactsUser: () => (query('data.db3', 'all', 'SELECT * FROM setingsContactsUser', [])),

    setSetingsSocketUser: (data) => (query('data.db3', 'run', 'UPDATE setingsSocketUser SET url=?, ws=?, port=? WHERE id=1', [data.url, data.ws, data.port])),
    setSetingsConsentUser: (consent) => (query('data.db3', 'run', 'UPDATE setingsConsentUser SET policyLink=?, consentLink=? WHERE id=1', [consent.policyLink, consent.consentLink])),
    setSetingsColorsUser: (colors) => (query('data.db3', 'run', 'UPDATE setingsColorsUser SET conteiner=?, top=?, messages=?, fromId=?, text=?, notification=?, toId=? WHERE id=1', [colors.conteiner, colors.top, colors.messages, colors.fromId, colors.text, colors.notification, colors.toId])),
    delSetingQuestionsUser: () => (query('data.db3', 'run', 'DELETE FROM setingsQuestionsUser', [])),
    setSetingQuestionsUser: (data) => (query('data.db3', 'run', 'INSERT OR REPLACE INTO setingsQuestionsUser (id, question, offOn) values ("'+ data.id + '", "'+ data.question + '", "'+ data.offOn + '")', [])),
    delSetingContactsUser: () => (query('data.db3', 'run', 'DELETE FROM setingsContactsUser', [])),
    setSetingContactsUser: (data) => (query('data.db3', 'run', 'INSERT OR REPLACE INTO setingsContactsUser (id, socialNetwork, link, offOn) values ("'+ data.id + '", "'+ data.socialNetwork + '", "'+ data.link + '", "'+ data.offOn + '")', [])),
    //-----------------------------------users-----------------------------------
    addUser: (chatId, socketId) => (query('data.db3', 'run', 'INSERT INTO users (chatId, socketId) values ("' + chatId + '","' + socketId + '")', [])),
    findUser: (chatId) => (query('data.db3', 'all', 'SELECT * FROM users WHERE chatId = "' + chatId + '"', [])),
    updateSocketId: (chatId, socketId) => (query('data.db3', 'run', 'UPDATE users SET socketId=? WHERE chatId=?', [socketId, chatId])),
    getUsers: () => (query('data.db3', 'all', 'SELECT * FROM users', [])),
    introduce: (name, email, chatId) => (query('data.db3', 'run', 'UPDATE users SET name=?, email=? WHERE chatId=?', [name, email, chatId])),
    userOnline: (chatId) => (query('data.db3', 'run', 'UPDATE users SET online=? WHERE chatId=?', [1, chatId])),
    userOffline: (chatId) => (query('data.db3', 'run', 'UPDATE users SET online=? WHERE chatId=?', [0, chatId])),
    findUserBySocketId: (socketId) => (query('data.db3', 'all', 'SELECT * FROM users WHERE socketId = "' + socketId + '"', [])),
    //-----------------------------------messages-----------------------------------
    //from, to, socketId, messageId, text, time, type, is_read
    addMessage: (fromId, toId, messageId, text, time, type, is_read) => (query('data.db3', 'run', 'INSERT INTO messages (fromId, toId, messageId, text, time, type, is_read) values ("' +
      fromId + '","' + toId + '","' + messageId + '","' + text + '","' + time + '","' + type + '","' + is_read + '")', [])),
    findMessege: messageId => (query('data.db3', 'all', 'SELECT * FROM messages WHERE messageId=?', [messageId])),
    getMessages: () => (query('data.db3', 'all', 'SELECT * FROM messages', [])),
    read: (chatId) => (query('data.db3', 'run', 'UPDATE messages SET is_read=? WHERE fromId=? OR toId=?', [1, chatId])),
    //-----------------------------------admin-----------------------------------
    getAdmin: () => (query('data.db3', 'all', 'SELECT * FROM admin', [])),
    updateAdminSocketId: (socketId) => (query('data.db3', 'all', 'UPDATE admin SET socketId=? WHERE id=1', [socketId])),
}
