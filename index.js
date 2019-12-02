require('dotenv').config();

const { randomBytes } = require('crypto');
const fetch = require('node-fetch');
const restify = require('restify');
const server = restify.createServer();

server.listen(process.env.PORT, () => {
  console.log(`${server.name} listening to ${server.url}`);
});

server.use(restify.plugins.queryParser());

server.get('/health.txt', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('OK');
});

async function createUserID() {
  return new Promise((resolve, reject) => {
    randomBytes(16, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(`dl_${buffer.toString('hex')}`);
      }
    });
  });
}

server.post('/directline/token', async (req, res) => {
  const origin = req.header('origin');
  const userID = await createUserID();
  const { token } = req.query;

  if (token) {
    console.log(`Refreshing Direct Line token for ${origin}`);
  } else {
    console.log(`Requesting Direct Line token for ${origin}`);
  }

  try {
    let cres;

    if (token) {
      cres = await fetch('https://directline.botframework.com/v3/directline/tokens/refresh', {
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });
    } else {
      cres = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
        body: JSON.stringify({ User: { Id: userID } }),
        headers: {
          authorization: `Bearer ${process.env.DIRECT_LINE_SECRET}`,
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });
    }

    if (cres.status === 200) {
      const json = await cres.json();

      if ('error' in json) {
        res.send(500, { 'Access-Control-Allow-Origin': 'https://yourdomain.com' });
      } else {
        res.send(
          {
            ...json,
            userID
          },
          { 'Access-Control-Allow-Origin': 'https://yourdomain.com' }
        );
      }
    } else {
      res.send(500, `Direct Line service returned ${cres.status} while exchanging for token`, {
        'Access-Control-Allow-Origin': 'https://yourdomain.com'
      });
    }
  } catch (err) {
    res.send(500);
  }
});
