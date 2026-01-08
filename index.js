//! При настройке портов в Ngin необходимо убрать строчку process.env.PORT из handlers_socketHandlersForUsers.js
//! Пользователь не видет прочитано или нет сообщение администратором, только добавление в базу и отправку менеджеру handlers_socketHandlersForUsers.js
global.evant = (filename, evant) => {
  console.log('\x1b[36m%s\x1b[0m',filename);
  console.log('\x1b[33m' + 'Cобытие сокета:' + '\x1b[0m \x1b[31m' + evant + '\x1b[31m ');
}
global.log = (filename, text, data) => {
  console.log('\x1b[36m%s\x1b[0m',filename);
  if (data === undefined) return console.log('\x1b[33m' + text + ': \x1b[0m ');
  console.log('\x1b[33m' + text + ': \x1b[0m ', data);
};
global.table = (data) => console.table(data);

require("dotenv").config();
// создаем базу данных и добавляем пользователя с паролем и логином - "1"
require("./services/dataBase").init('1', '1')
const express = require("express"),
  app = express(),
  cookieParser = require("cookie-parser"),
  process = require("process"),
  cors = require("cors"),
  routes = require("./routes"),
  HOST = process.env.HOST,
  PORT = process.env.PORT,
  SOCKET_PORT = process.env.SOCKET_PORT,
  UsersController = require('./controllers/UsersController');

//При любой перезагрузке сервера все пользователи, занесенные в базу становятся offLine
UsersController.allUsersOffline();  

(http = require("http").Server(app)),
  // socket----------------------------------------
  ({ Server } = require("socket.io")),
  // обработчик для менеджера
  (socketHandlersForAdmin = require("./handlers/socketHandlersForAdmin")),
  // обработчик для пользователя
  (socketHandlersForUsers = require("./handlers/socketHandlersForUsers")),
  (io = new Server(SOCKET_PORT, {
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    cors: { origin: "*" },
  }));
//socketHandlersForAdmin
io.use((socket, next) =>
  socketHandlersForAdmin.authentication(socket, next)
);
io.on("connection", (socket) =>
  socket.authentication === true
    ? socketHandlersForAdmin.connection(socket)
    : socketHandlersForUsers.connection(socket)
);
// socket----------------------------------------

const corsOptions = {
  // хосты с которых разрешены запросы
  origin: ["http://localhost:3001", "http://localhost:3000"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use("/", routes);

app.listen(PORT, HOST, () =>
  console.log(`Server listens http://${HOST}:${PORT}`)
);
