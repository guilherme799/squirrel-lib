import { WhatsAppCommand } from "../models/whatsapp-command-model";

export interface ICommandHandler {
  name: string;
  description: string;
  variadions: Array<string>;
  usage: string;
  context: string;
  handle(command: WhatsAppCommand): Promise<void>;
}
