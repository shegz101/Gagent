import { Mastra } from '@mastra/core/mastra';
import { workspaceAgent } from '../agents/workspace.agent.js';
import { aiWorkspaceMcpServer } from '../mcp/server.js';

/**
 * Main Mastra configuration
 *
 * This is the central configuration file that:
 * - Registers all agents
 * - Registers MCP servers
 * - Configures workflows (if needed)
 * - Sets up integrations
 */
export const mastra = new Mastra({
  agents: {
    workspaceAgent,
  },
  mcpServers: {
    aiWorkspaceMcpServer,
  },
});

// Export the configured agent for direct use
export { workspaceAgent } from '../agents/workspace.agent.js';

// Export utility functions
export {
  generateDailySummary,
  optimizeSchedule,
  handleUrgentItems,
} from '../agents/workspace.agent.js';
