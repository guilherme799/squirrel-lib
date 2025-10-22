export class DangerMessageError extends Error {
  constructor(message?: string) {
    super();
    this.message = message || "Ocorreu um erro grave ao executar o comando.";
  }
}
