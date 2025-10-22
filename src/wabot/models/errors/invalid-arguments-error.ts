export class InvalidArqumentsError extends Error {
  constructor(errorMessage?: string, argument?: string) {
    super();
    this.message = errorMessage ?? `O ${argument} é inválido.`;
  }
}
