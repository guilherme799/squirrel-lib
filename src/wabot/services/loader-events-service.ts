import "reflect-metadata";
import { Service } from "typedi";
import { MessagesMidleware } from "../midlewares/messages-midleware";
import { ConfigService } from "./config-service";
import { WASocket } from "baileys";

@Service()
export class LoaderEventsService {
  constructor(
    private messagesMidleware: MessagesMidleware,
    private configService: ConfigService
  ) {}

  public load(socket: WASocket): void {
    socket.ev.on("messages.upsert", ({ messages }) => {
      setTimeout(async () => {
        await this.messagesMidleware.handleMessageUpsert(socket, messages);
      }, this.configService.eventsTimeout);
    });
  }
}
