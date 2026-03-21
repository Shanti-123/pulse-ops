import { startMCPAgent } from './agent';

export const initMCPServer = (): void => {
  startMCPAgent();
  console.log('⚡ MCP Server initialized');
};