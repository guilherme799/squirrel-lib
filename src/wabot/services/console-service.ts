import "reflect-metadata";
import * as readLine from "readline";
import { ConfigService } from "./config-service";
import { Service } from "typedi";

@Service()
export class ConsoleService {
  constructor(private configService: ConfigService) {}

  public question(message: string): Promise<string> {
    const readline = readLine.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) =>
      readline.question(
        `\x1b[30m[${this.configService.botConfig.name} | INPUT]\x1b[0m${message}`,
        resolve
      )
    );
  }

  public logInfo(message: string): void {
    console.log(
      `\x1b[34m[${this.configService.botConfig.name} | INFO]\x1b[0m ${message}`
    );
  }

  public logError(message: string): void {
    console.error(
      `\x1b[31m[${this.configService.botConfig.name} | ERROR]\x1b[0m ${message} Try again with "npm start"`
    );

    process.exit(1);
  }

  public logWarning(message: string): void {
    console.warn(
      `\x1b[33m[${this.configService.botConfig.name} | WARNING]\x1b[0m ${message}`
    );
  }

  public logSuccess(message: string): void {
    console.log(
      `\x1b[32m[${this.configService.botConfig.name} | SUCCESS]\x1b[0m ${message}`
    );
  }
}
