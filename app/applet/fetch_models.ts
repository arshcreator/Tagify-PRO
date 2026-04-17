import https from 'https';

const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/models',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).data;
    console.log(models.map(m => m.id).filter(id => id.includes('vision') || id.includes('llama-3.2')));
  });
});

req.on('error', (e) => console.error(e));
req.end();
