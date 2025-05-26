#!/usr/bin/env node

import OmniFocusServer from './server.js';

// Create and run the server
const server = new OmniFocusServer();
server.run().catch(console.error);