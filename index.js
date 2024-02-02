const TelegramApi = require('node-telegram-bot-api');
const XLSX = require('xlsx');
const token = '6781131766:AAEQ76-288n3I0DwIi16V7d0Lqg9SWyxf64';

const bot = new TelegramApi(token, { polling: true });

const filePath = './Table1.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];


const dataArray = XLSX.utils.sheet_to_json(worksheet, {
  header: 1,
  range: 'A1:J2000',
  raw: false,
  defval: '',
  blankrows: false,
});

const groupstud = {};
const groupInputFlag = {};
let savedGroupNumberByChatId = {};
const selectedDayByChatId = {};
const selectedDayTypeByChatId = {};


const Options = {
  reply_markup: JSON.stringify({
      inline_keyboard: [
          [{text: 'Понедельник', callback_data: 'пн'}, {text: 'Вторник', callback_data: 'вт'}, {text: 'Среда', callback_data: 'ср'}],
          [{text: 'Четверг', callback_data: 'чт'}, {text: 'Пятница', callback_data: 'пт'}, {text: 'Суббота', callback_data: 'сб'}],
          [{text: 'четное', callback_data: 'чет'}, {text: 'нечетное', callback_data: 'неч'}],
      ]


  })
}

bot.setMyCommands([
  { command: '/start', description: 'Запуск бота' },
  { command: '/help', description: 'Мануал бота' },
  { command: '/raspisania', description: 'Расписание' },
  { command: '/group', description: 'Номер группы *Обязательно' },
]);



bot.on('message', async (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;
  



  if (text === '/start' || text === '/start@Raspisania_pool_bot') {
    await bot.sendMessage(chatId, `Добро пожаловать в расписание, ${msg.from.first_name}`);
  }

  if (text === '/help' || text === '/help@Raspisania_pool_bot') {
    await bot.sendMessage(chatId, `ЭТОТ БОТ РАСЧИТАН ДЛЯ СТУДЕНТА КАИ:\n\nС помощью этого бота, можно узнать расписание для каждого группы, так же дни недели и чётность \n\nКАК ИСПОЛЬЗОВАТЬ БОТА:\n\nСначала мы пишем команду '/group' чтобы сделать сортировку, потом пишем команду '/raspisania' и там выбирайте вам нужную дни недели, и честность. И бот вам напишет вам расписание.\n\nСам бот написан на JavaScript.\n\nРазработчик: rail_2\n\nVersion: beta 0.6`);
  }

  if (text === '/raspisania' || text === '/raspisania@Raspisania_pool_bot') {
    await bot.sendMessage(chatId, 'Выберите дни недели', Options);
  }

});




bot.on('callback_query', (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;

  if (['пн', 'вт', 'ср', 'чт', 'пт', 'сб'].includes(data)) {
    selectedDayByChatId[chatId] = data;
  }


  if (['чет', 'неч'].includes(data)) {
    selectedDayTypeByChatId[chatId] = data;
  }


  if (selectedDayByChatId[chatId] && selectedDayTypeByChatId[chatId])
   {
    bot.sendMessage(chatId, `выбрана ${selectedDayByChatId[chatId]}, ${selectedDayTypeByChatId[chatId]}`);
  
    const filteredData = dataArray.filter(
      (row) =>
        Number(row[0]) === savedGroupNumberByChatId[chatId] &&
        row[1].replace(/\s/g, '').includes(selectedDayByChatId[chatId]) &&
        (
          new RegExp(selectedDayTypeByChatId[chatId]).test(row[3]) ||
          row[3].trim() === '()' ||
          row[3].trim() === '(Пусто)' ||
          row[3].trim() === '' ||
          /\(?\s*до\s*\d+\.\d+\s*\)?/.test(row[3])
        )
    );


    

    const formattedData = filteredData.map(row => {
      return `Группа: ${row[0]}\nДень: ${row[1].trim()}\nВремя: ${row[2]}\nПредмет: ${row[4]}\nДата: ${row[3]}\nАудитория: ${row[6]}\nВид занятие: ${row[5]}\nПреподаватель: ${row[9].trim()}\n -------------------------------------------------`;
    });
    
    const messageText = `Отфильтрованные данные:\n${formattedData.join('\n')}`;
    
    bot.sendMessage(chatId, messageText);
    

   
    delete selectedDayByChatId[chatId];
    delete selectedDayTypeByChatId[chatId];
  }
});



bot.on('text', async (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;

  if (text === '/group@Raspisania_pool_bot') {
    savedGroupNumberByChatId[chatId] = 4334;
    bot.sendMessage(chatId, 'Выбрана группа: 4334');
  } else {
    if (text === '/group') {
      groupInputFlag[chatId] = true;
      await bot.sendMessage(chatId, 'Напишите номер группы');
    } else if (groupInputFlag[chatId]) {
      const enteredNumber = parseInt(text, 10);

      if (!isNaN(enteredNumber) && /^\d{4}$/.test(enteredNumber.toString())) {
        groupstud[chatId] = enteredNumber;
        groupInputFlag[chatId] = false;
        await bot.sendMessage(chatId, 'Номер группы сохранен!');

        savedGroupNumberByChatId[chatId] = groupstud[chatId];
        await bot.sendMessage(chatId, `Сохраненный номер группы: ${savedGroupNumberByChatId[chatId]}`);
      } else {
        await bot.sendMessage(chatId, 'Неверный формат номера группы');
      }
    }
  }

});
