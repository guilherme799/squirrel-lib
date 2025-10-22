import { Container, Service } from "typedi";
import { ICommandHandler } from "../contracts/icommand-handler";
import { WhatsAppCommand } from "../models/whatsapp-command-model";
import { ConfigService } from "../services/config-service";
import { ContextConfig } from "../contracts/config";

@Service()
export class CommandHandlerFactory {
  constructor(private configService: ConfigService) {}

  public async getCommandHandler(
    whatsAppCommand: WhatsAppCommand
  ): Promise<ICommandHandler | null | undefined> {
    let contextConfig = this.getContextConfiguration(whatsAppCommand);

    if (contextConfig == null) return null;
    else if (contextConfig.isPublic)
      return this.getPublicHandler(contextConfig, whatsAppCommand);

    return this.getSuperUserHandler(contextConfig, whatsAppCommand);
  }

  private getContextConfiguration(command: WhatsAppCommand) {
    let { contextsConfig } = this.configService;
    let contextConfig = contextsConfig.find((config) =>
      config.commands.any((cmd) =>
        cmd.variations.includes(command.commandName!.trim())
      )
    );

    return contextConfig;
  }

  private getPublicHandler(
    contextConfig: ContextConfig,
    whatsAppCommand: WhatsAppCommand
  ) {
    let command = this.getCommandByVariation(contextConfig, whatsAppCommand);

    return Container.get<ICommandHandler>(
      `${contextConfig.name}${command!.name.trim()}CommandHandler`
    );
  }

  private async getSuperUserHandler(
    contextConfig: ContextConfig,
    whatsAppCommand: WhatsAppCommand
  ): Promise<ICommandHandler | null | undefined> {
    let { participants, owner } = await whatsAppCommand.socket!.groupMetadata(
      whatsAppCommand.remoteJid!
    );
    let participant = participants!.find(
      (p) => p.id === whatsAppCommand.userJid!
    );

    if (
      !participant ||
      (contextConfig.onlyOwner && participant.id !== owner) ||
      (participant.admin != "superadmin" && participant.admin != "admin")
    ) {
      return null;
    }

    if (contextConfig.onlyOwner && participant.id !== owner) return null;
    if (!(participant.admin == "superadmin" || participant.admin == "admin"))
      return null;

    let command = this.getCommandByVariation(contextConfig, whatsAppCommand);

    return Container.get<ICommandHandler>(
      `${contextConfig.name}${command!.name}CommandHandler`
    );
  }

  private getCommandByVariation(
    contextConfig: ContextConfig,
    whatsAppCommand: WhatsAppCommand
  ) {
    return contextConfig.commands.find((cmd) =>
      cmd.variations.includes(whatsAppCommand.commandName!)
    );
  }
}
