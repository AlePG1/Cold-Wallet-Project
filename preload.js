const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('walletAPI', {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  createAccount: (data) => ipcRenderer.invoke('create-account', data),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
  getAddress: (data) => ipcRenderer.invoke('get-address', data),
  signTransaction: (data) => ipcRenderer.invoke('sign-transaction', data),
  listInbox: () => ipcRenderer.invoke('list-inbox'),
  verifyTransaction: (filename) => ipcRenderer.invoke('verify-transaction', filename),
  listOutbox: () => ipcRenderer.invoke('list-outbox'),
  listVerified: () => ipcRenderer.invoke('list-verified')
});
