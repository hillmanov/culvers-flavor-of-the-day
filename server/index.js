const express = require('express');
const Promise = require('bluebird');
const sqlite = require('sqlite');

const app = express();
const port = 3002;

(async () => {
  const db = await sqlite.open(__dirname + '/../db.sqlite', { Promise, verbose: true });
  app.use(express.static(__dirname + '/../client/build/'));
  app.get('/api', async (_, res) => {
    res.json(await db.all(`SELECT * FROM flavor_of_the_day`));
  });
  app.listen(port, () => console.log(`Flavor of the day app listening on port ${port}!`))
})();

