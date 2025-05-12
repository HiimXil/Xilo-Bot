import { Client, REST, Routes } from "discord.js";
import type Command from "../interfaces/Command";
import { Logger } from "../Utils/logger";

export default class CommandHandler {
  private commands: Map<string, Command> = new Map();
  private rest: REST;

  constructor() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error("Bot token not found in environment variables");
    }
    this.rest = new REST().setToken(token);
  }

  public async registerCommands(client: Client) {
    try {
      const commands = Array.from(this.commands.values()).map((cmd) =>
        cmd.data.toJSON()
      );

      if (!client.user) {
        throw new Error("Bot user is not available");
      }

      if (process.env.NODE_ENV === "development" && process.env.DEV_GUILD_ID) {
        // Register commands to a specific guild in development mode
        await this.rest.put(
          Routes.applicationGuildCommands(
            client.user.id,
            process.env.DEV_GUILD_ID
          ),
          { body: commands }
        );
        Logger.info(
          `Registered ${commands.length} commands to guild ${process.env.DEV_GUILD_ID}`
        );
      } else {
        // Register commands globally in production
        await this.rest.put(Routes.applicationCommands(client.user.id), {
          body: commands,
        });
        Logger.info(`Registered ${commands.length} commands globally`);
      }
    } catch (error) {
      Logger.error("Failed to register commands: " + error);
    }
  }

  public addCommand(command: Command) {
    this.commands.set(command.data.name, command);
  }

  public getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }
}
