export interface CommandConfig {
  name: string;
  variations: Array<string>;
}

export interface ContextConfig {
  name: string;
  isPublic: boolean;
  onlyOwner: boolean;
  icon: string;
  commands: Array<CommandConfig>;
}

export interface Configuration {
  events_timeout: number;
  prefix: string;
  tempDir: string;
  stickersDir: string;
  openAIConfig: {
    apiKey: string;
    url: string;
  };
  botConfig: {
    emoji: string;
    name: string;
    phoneNumber: string;
  };
  contexts: Array<ContextConfig>;
}