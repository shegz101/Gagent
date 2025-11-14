import { MastraMCPClient } from '@mastra/mcp';

/**
 * MCP Client configuration
 *
 * This client connects to our local MCP server that exposes
 * calendar, email, and task management tools
 */
export const aiWorkspaceMcpClient = new MCPClient({
  id: 'ai-workspace-client',
  servers: {
    workspace: {
      command: 'node',
      args: ['dist/mcp/server.js'], // Points to compiled MCP server
    },
  },
});

/**
 * Get all tools from the MCP client
 * This function is used by the agent to access MCP tools
 */
export async function getWorkspaceTools() {
  try {
    const tools = await aiWorkspaceMcpClient.getTools();
    return tools;
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return {};
  }
}
