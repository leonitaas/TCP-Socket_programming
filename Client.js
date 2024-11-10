const net = require('net');
const readline = require('readline');

// IP adresa dhe porta e serverit
const PORT = 12345;
const HOST = '127.0.0.1';

const client = new net.Socket();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

client.connect(PORT, HOST, () => {
  console.log('Connected to server');
  rl.prompt();

  rl.on('line', (line) => {
    client.write(line.trim());
    rl.prompt();
  });
});

client.on('data', (data) => {
  console.log(`Server: ${data}`);
  rl.prompt();
});

client.on('close', () => {
  console.log('Disconnected from server');
  rl.close();
});

client.on('error', (err) => {
  console.error('Connection error:', err.message);
  rl.close();
});
