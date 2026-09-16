export class ServerError extends Error {
  public readonly status: number;

  constructor(status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
    this.status = status;
  }
}

export class BadRequestError extends ServerError {
  constructor(message: string = 'Bad Request', cause?: unknown) {
    super(400, message, cause);
  }
}

export class UnauthorizedError extends ServerError {
  constructor(message: string = 'Unauthorized', cause?: unknown) {
    super(401, message, cause);
  }
}

export class ForbiddenError extends ServerError {
  constructor(message: string = 'Forbidden', cause?: unknown) {
    super(403, message, cause);
  }
}

export class NotFoundError extends ServerError {
  constructor(message: string = 'Not Found', cause?: unknown) {
    super(404, message, cause);
  }
}

export class ConflictError extends ServerError {
  constructor(message: string = 'Conflict', cause?: unknown) {
    super(409, message, cause);
  }
}

export class InternalServerError extends ServerError {
  constructor(message: string = 'Internal Server Error', cause?: unknown) {
    super(500, message, cause);
  }
}
