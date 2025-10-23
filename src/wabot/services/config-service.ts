import "reflect-metadata";
import path from "path";
import packageInfo from "../../../package.json";
import { Service } from "typedi";
import type { Configuration, ContextConfig } from "../contracts/config";

@Service()
export class ConfigService {
  constructor(private config: Configuration) {}

  public throwIfCofigurationIsNull() {
    if (!this.config) {
      console.error("\x1b[31m[ERROR] \x1b[31mConfiguration not setup properly.\x1b[0m");

      process.exit(1);
    }
  }
  
  public get eventsTimeout(): number {
    return this.config.events_timeout;
  }

  public get prefix(): string {
    return this.config.prefix;
  }

  public get tempDir(): string {
    return path.resolve(__dirname, this.config.tempDir);
  }

  public get openAIConfig(): { apiKey: string; url: string } {
    return this.config.openAIConfig;
  }

  public get botConfig(): {
    emoji: string;
    name: string;
    phoneNumber: string;
  } {
    return this.config.botConfig;
  }

  public get contextsConfig(): Array<ContextConfig> {
    return this.config.contexts;
  }

  public get applicationVersion(): string {
    return packageInfo.version;
  }

  public get stickersDir(): string {
    return path.resolve(__dirname, this.config.stickersDir);
  }
}
