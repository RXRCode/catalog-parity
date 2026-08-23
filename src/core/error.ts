export class CatalogParityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogParityError";
  }
}
