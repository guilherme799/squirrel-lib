import "reflect-metadata";
import { WhatsAppCommand } from "../models/whatsapp-command-model";
import { Service } from "typedi";
import { AlertTypeEnum } from "../enums/alert-type-enum";
import { CommandHandlerFactory } from "../factories/commandHandlers-factory";
import { InvalidArqumentsError } from "../models/errors/invalid-arguments-error";
import { WarningMessageError } from "../models/errors/warning-message-error";
import { DangerMessageError } from "../models/errors/danger-message-error";
import { ConsoleService } from "./console-service";
import { ICommandHandler } from "../contracts/icommand-handler";

@Service()
export class CommandService {
  constructor(
    private commandHandlerFactory: CommandHandlerFactory,
    private consoleService: ConsoleService
  ) {}

  public async executeDynamicCommand(command: WhatsAppCommand): Promise<void> {
    if (!command.hasPrefix || !command.commandName) return;

    let commandHandler = await this.commandHandlerFactory.getCommandHandler(
      command
    );

    if (!commandHandler) {
      command.replyAlert(
        "Você não tem permissão para executar este comando.",
        AlertTypeEnum.error
      );
      return;
    }

    await this.tryExecuteHandler(commandHandler, command);
  }

  private async tryExecuteHandler(
    commandHandler: ICommandHandler | null | undefined,
    command: WhatsAppCommand
  ) {
    try {
      await commandHandler?.handle(command);
    } catch (ex) {
      this.consoleService.logWarning(JSON.stringify(ex));
      if (
        ex instanceof InvalidArqumentsError ||
        ex instanceof WarningMessageError
      )
        command.replyAlert(ex.message, AlertTypeEnum.warning);
      else if (ex instanceof DangerMessageError)
        command.replyAlert(ex.message, AlertTypeEnum.error);
      else
        command.replyAlert(
          "Ocorreu um erro ao executar o comando.",
          AlertTypeEnum.error
        );
    }
  }
}
