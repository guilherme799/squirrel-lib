import { ConfigService } from "../services/config-service";
import { MessageMediaType } from "../enums/message-media-type-enum";
import {
  AnyMessageContent,
  DownloadableMessage,
  downloadContentFromMessage,
  MediaType,
  proto,
  WAMessage,
  WASocket,
} from "baileys";
import path from "path";
import { writeFile } from "fs/promises";
import fs from "fs";
import { AlertTypeEnum } from "../enums/alert-type-enum";
import { MediaExtensionsEnum } from "../enums/media-extensions-enum";
import { ParticipantsActionEnum } from "../enums/participants-action-enum";
import { queryObjects } from "v8";

export class WhatsAppCommand {
  args?: any[] | undefined;
  commandName?: string | null | undefined;
  fullArgs?: string | null | undefined;
  fullMessage?: string | null | undefined;
  isReply?: boolean;
  prefix?: string | null | undefined;
  remoteJid?: string | null | undefined;
  replyJid?: string | null | undefined;
  userJid?: string | null | undefined;
  messageMidiaType?: MediaType | null | undefined;
  messageContent?: DownloadableMessage | null | undefined;
  whatsAppMessage?: WAMessage | undefined;
  socket?: WASocket | null | undefined;

  private configServeice: ConfigService;

  constructor(
    whatsappMessagesage: WAMessage,
    configService: ConfigService,
    soket?: WASocket
  ) {
    let fullMessage =
      whatsappMessagesage.message?.conversation ??
      whatsappMessagesage.message?.extendedTextMessage?.text ??
      whatsappMessagesage.message?.imageMessage?.caption ??
      whatsappMessagesage.message?.videoMessage?.caption;

    this.whatsAppMessage = whatsappMessagesage;
    this.socket = soket;
    this.configServeice = configService;
    this.buildCommand(fullMessage, whatsappMessagesage);
  }

  private async buildCommand(
    fullMessage: string | null | undefined,
    whatsappMessagesage: WAMessage
  ) {
    let [command, ...args] = (fullMessage || "").split(" ");
    let prefix = command.charAt(0);
    let commandWithoutPrefix = command.replace(
      new RegExp(`^[${this.configServeice.prefix}]+`),
      ""
    );

    this.args = this.splitByCharacters(args.join(" "), ["\\", "|", "/"]);
    this.commandName = this.formatCommand(commandWithoutPrefix);
    this.fullArgs = args.join(" ");
    this.fullMessage = fullMessage;
    this.messageMidiaType = this.getMessageType(whatsappMessagesage);
    (this.isReply =
      whatsappMessagesage?.message?.extendedTextMessage?.contextInfo
        ?.quotedMessage != null || false),
      (this.prefix = prefix);
    (this.remoteJid = whatsappMessagesage!.key?.remoteJid),
      (this.replyJid =
        whatsappMessagesage?.message?.extendedTextMessage?.contextInfo?.participant),
      (this.userJid = whatsappMessagesage?.key?.participant?.replace(
        /:[0-9][0-9]|:[0-9]/g,
        ""
      ));
  }

  private splitByCharacters(
    str: string,
    characters: string[]
  ): any[] | undefined {
    characters = characters.map((char) => (char === "\\" ? "\\\\" : char));
    const regex = new RegExp(`[${characters.join("")}]`);

    return str
      .split(regex)
      .map((str) => str.trim())
      .filter(Boolean);
  }

  private formatCommand(
    commandWithoutPrefix: string
  ): string | null | undefined {
    return this.onlyLettersAndNumbers(
      this.removeAccentsAndSpecialCharacters(
        commandWithoutPrefix.toLocaleLowerCase().trim()
      )
    );
  }

  private onlyLettersAndNumbers(text: string): string | null | undefined {
    return text.replace(/[^a-zA-Z0-9]/g, "");
  }

  private removeAccentsAndSpecialCharacters(text: string): string {
    if (!text) return "";

    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  private getMessageType(
    whatsappMessage: WAMessage
  ): MediaType | null | undefined {
    if (
      whatsappMessage?.message?.audioMessage ||
      whatsappMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.audioMessage
    ) {
      this.messageContent =
        whatsappMessage?.message?.audioMessage ??
        whatsappMessage?.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage?.audioMessage;
      return MessageMediaType.audio;
    }
    if (
      whatsappMessage?.message?.imageMessage ||
      whatsappMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.imageMessage
    ) {
      this.messageContent =
        whatsappMessage?.message?.imageMessage ??
        whatsappMessage?.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage?.imageMessage;
      return MessageMediaType.image;
    }
    if (
      whatsappMessage?.message?.videoMessage ||
      whatsappMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.videoMessage
    ) {
      this.messageContent =
        whatsappMessage?.message?.videoMessage ??
        whatsappMessage?.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage?.videoMessage;
      return MessageMediaType.video;
    }
    if (
      whatsappMessage?.message?.imageMessage ||
      whatsappMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.imageMessage
    ) {
      this.messageContent =
        whatsappMessage?.message?.imageMessage ??
        whatsappMessage?.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage?.imageMessage;
      return MessageMediaType.image;
    }
    if (
      whatsappMessage?.message?.stickerMessage ||
      whatsappMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.stickerMessage
    ) {
      this.messageContent =
        whatsappMessage?.message?.stickerMessage ??
        whatsappMessage?.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage?.stickerMessage;
      return MessageMediaType.sticker;
    }

    return null;
  }

  public get isImageOrVideo(): boolean {
    return (
      this.messageMidiaType == MessageMediaType.image ||
      this.messageMidiaType == MessageMediaType.video
    );
  }

  public get isSticker(): boolean {
    return this.messageMidiaType == MessageMediaType.sticker;
  }

  public async downloadMessage(
    fileName: string,
    extension: MediaExtensionsEnum
  ): Promise<string | null | undefined> {
    if (this.messageContent == null) return null;

    let stream = await downloadContentFromMessage(
      this.messageContent,
      this.messageMidiaType!
    );

    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const filePath = path.resolve(
      this.configServeice.tempDir,
      `${fileName}.${extension}`
    );

    await writeFile(filePath, buffer);

    return filePath;
  }

  public async sendText(
    text: string
  ): Promise<proto.WebMessageInfo | null | undefined> {
    if (this.socket == null || this.remoteJid == null) return null;

    return <proto.WebMessageInfo>(
      await this.socket.sendMessage(this.remoteJid, { text: text })
    );
  }

  public async replyText(
    text: string | null | undefined
  ): Promise<proto.WebMessageInfo | null | undefined> {
    if (this.socket == null || this.remoteJid == null) return null;

    return <proto.WebMessageInfo>(
      await this.socket.sendMessage(
        this.remoteJid,
        { text: text ?? "" },
        { quoted: this.whatsAppMessage }
      )
    );
  }

  public async sendReact(
    text: string
  ): Promise<proto.WebMessageInfo | null | undefined> {
    if (this.socket == null || this.remoteJid == null) return null;

    return <proto.WebMessageInfo>await this.socket.sendMessage(this.remoteJid, {
      react: { text, key: this.whatsAppMessage?.key },
    });
  }

  public async sendAlert(
    alertType: AlertTypeEnum
  ): Promise<proto.WebMessageInfo | null | undefined> {
    return await this.sendReact(alertType);
  }

  public async replyAlert(
    text: string,
    alertType: AlertTypeEnum
  ): Promise<proto.WebMessageInfo | null | undefined> {
    await this.sendReact(alertType);
    return await this.replyText(`${alertType} ${text}`);
  }

  public async sendMessageFromFile(
    filePath: string,
    isImage: boolean,
    quoted: boolean = true
  ): Promise<proto.WebMessageInfo | null | undefined> {
    return this.internalSendMessage(quoted, () => {
      if (isImage) return { image: fs.readFileSync(filePath) };
      else return { sticker: fs.readFileSync(filePath) };
    });
  }

  public async sendMessageFromUrl(
    url: string,
    isImage: boolean,
    quoted: boolean = true
  ): Promise<proto.WebMessageInfo | undefined | null> {
    return this.internalSendMessage(quoted, () => {
      if (isImage) return { image: { url } };
      else return { sticker: { url } };
    });
  }

  private async internalSendMessage(
    quoted: boolean,
    contentResolver: () => AnyMessageContent
  ): Promise<proto.WebMessageInfo | undefined | null> {
    if (this.socket == null || this.remoteJid == null) return null;

    let quotedObject = quoted ? { quoted: this.whatsAppMessage } : {};
    let data = contentResolver();

    return <proto.WebMessageInfo>await this.socket.sendMessage(
      this.remoteJid,
      data,
      {
        ...quotedObject,
      }
    );
  }

  public get hasPrefix(): boolean {
    return this.configServeice.prefix.equals(this.prefix!);
  }

  public async groupParticipantsUpdate(
    participants: string[],
    participantsAction: ParticipantsActionEnum
  ) {
    if (this.socket == null || this.remoteJid == null) return null;

    await this.socket.groupParticipantsUpdate(
      this.remoteJid,
      participants,
      participantsAction
    );
  }
}
