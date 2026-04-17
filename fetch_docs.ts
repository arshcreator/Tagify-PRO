import https from 'https';
https.get('https://console.groq.com/docs/deprecations', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('April 14, 2025')) {
        console.log(lines.slice(i, i + 30).join('\n'));
        break;
      }
    }
  });
});
