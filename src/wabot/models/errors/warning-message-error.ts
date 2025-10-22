export class WarningMessageError extends Error {
  constructor(message?: string) {
    super();
    this.message = message || "Ocorreu um erro ao executar o comando";
  }
}
