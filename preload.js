const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('arcadeApp', { platform: process.platform });