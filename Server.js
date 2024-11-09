const net = require('net');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 12345;
const HOST = '127.0.0.1';

const clients = [];
const MAX_CONNECTIONS = 5;

let exclusiveClient = null;

function logRequest(ip, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] - ${ip}: ${message}\n`;
  fs.appendFileSync('server_log.txt', logMessage);
}

function saveMessage(ip, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] - ${ip}: ${message}\n`;
  fs.appendFileSync('client_messages.txt', logMessage);
}

function writeToServerFile(filename, message) {
  const filePath = path.join(__dirname, 'server_files', filename);
  fs.appendFileSync(filePath, `${message}\n`);
}

const server = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;

  if (clients.length >= MAX_CONNECTIONS) {
    socket.write('Connection limit reached. Please try again later.\n');
    socket.end();
    return;
  }

  clients.push(socket);

  if (exclusiveClient === null) {
    exclusiveClient = socket;
    socket.write('You have exclusive write, read, and execute access on this server.\n');
  } else {
    socket.write('You have read-only access.\n');
  }
  
  console.log(`New connection from ${clientAddress}`);
  logRequest(clientAddress, 'Connected');

  socket.setTimeout(60000);

  socket.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`Received message from ${clientAddress}: ${message}`);
    saveMessage(clientAddress, message);

    if (message.startsWith('write:')) {
      if (socket === exclusiveClient) {
        const parts = message.split(':');
        const filename = parts[1];
        const dataToWrite = parts.slice(2).join(':').trim();
        writeToServerFile(filename, dataToWrite);
        socket.write(`Data successfully written to ${filename}.\n`);
      } else {
        socket.write('You have read-only access. Write access is restricted.\n');
      }
    } else if (message.startsWith('read:')) {
      const filename = message.slice(5).trim();
      const filePath = path.join(__dirname, 'server_files', filename);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          socket.write(`Error reading file ${filename}.\n`);
          console.error(err);
        } else {
          socket.write(`File content of ${filename}:\n${data}\n`);
        }
      });
    } else if (message.startsWith('execute:')) {
      if (socket === exclusiveClient) {
        const command = message.slice(8).trim();
        exec(command, (err, stdout, stderr) => {
          if (err) {
            socket.write(`Error executing command: ${stderr}\n`);
            console.error(err);
          } else {
            socket.write(`Command executed successfully. Output:\n${stdout}\n`);
          }
        });
      } else {
        socket.write('You have read-only access. Execute access is restricted.\n');
      }
    }


  })})
