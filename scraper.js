const { trim, each } = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

(async () => {
  // Scrape
  const { data: mainPageHTML } = await axios.get('https://www.culvers.com/restaurants/orem-ut');
  let $ = cheerio.load(mainPageHTML);
  const flavorOfTheDay = [];
  $('#entire-month .lowerstub, #next-month .lowerstub').each(function() { 
    const date = moment(trim($(this).find('.date').text()), 'dddd, MMMM DD').set('year', new Date().getFullYear()).format('YYYY-MM-DD');
    const flavor = $(this).find('.fotd a.value').text();
    const image = `https:${$(this).find('img').attr('src')}`;
    flavorOfTheDay.push({ date, flavor, image });
  });


  // DB
  const db = await sqlite.open({
    filename: __dirname + '/db.sqlite', 
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS flavor_of_the_day (
      date DATE,
      flavor TEXT,
      image TEXT
    )`
  );

  await db.exec(`DELETE FROM flavor_of_the_day`);
  const insert = await db.prepare('INSERT OR IGNORE INTO flavor_of_the_day (date, flavor, image) VALUES (?, ?, ?)');
  each(flavorOfTheDay, async ({ date, flavor, image }) => {
    await insert.run(date, flavor, image);
  });
  await insert.finalize();
})();

