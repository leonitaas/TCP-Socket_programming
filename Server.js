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
})