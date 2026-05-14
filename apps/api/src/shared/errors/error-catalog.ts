export const ErrorCode = {
  AdminNotFound: "ADMIN_NOT_FOUND",
  BranchNotFound: "BRANCH_NOT_FOUND",
  InternalError: "INTERNAL_ERROR",
  InvalidCredentials: "INVALID_CREDENTIALS",
  InvalidUpload: "INVALID_UPLOAD",
  InvalidToken: "INVALID_TOKEN",
  MenuNotFound: "MENU_NOT_FOUND",
  MissingAuthContext: "MISSING_AUTH_CONTEXT",
  MissingToken: "MISSING_TOKEN",
  RouteNotFound: "ROUTE_NOT_FOUND",
  TableNotFound: "TABLE_NOT_FOUND",
  TokenExpired: "TOKEN_EXPIRED",
  ValidationError: "VALIDATION_ERROR"
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

type ErrorDefinition = {
  code: ErrorCode;
  message: string;
  statusCode: number;
};

export const errorCatalog = {
  [ErrorCode.AdminNotFound]: {
    code: ErrorCode.AdminNotFound,
    message: "Admin not found",
    statusCode: 404
  },
  [ErrorCode.BranchNotFound]: {
    code: ErrorCode.BranchNotFound,
    message: "Branch not found",
    statusCode: 404
  },
  [ErrorCode.InternalError]: {
    code: ErrorCode.InternalError,
    message: "Unexpected server error",
    statusCode: 500
  },
  [ErrorCode.InvalidCredentials]: {
    code: ErrorCode.InvalidCredentials,
    message: "Invalid email or password",
    statusCode: 401
  },
  [ErrorCode.InvalidUpload]: {
    code: ErrorCode.InvalidUpload,
    message: "Invalid image upload",
    statusCode: 400
  },
  [ErrorCode.InvalidToken]: {
    code: ErrorCode.InvalidToken,
    message: "Invalid token",
    statusCode: 401
  },
  [ErrorCode.MenuNotFound]: {
    code: ErrorCode.MenuNotFound,
    message: "Menu item not found",
    statusCode: 404
  },
  [ErrorCode.MissingAuthContext]: {
    code: ErrorCode.MissingAuthContext,
    message: "Missing auth context",
    statusCode: 401
  },
  [ErrorCode.MissingToken]: {
    code: ErrorCode.MissingToken,
    message: "Missing bearer token",
    statusCode: 401
  },
  [ErrorCode.RouteNotFound]: {
    code: ErrorCode.RouteNotFound,
    message: "Route not found",
    statusCode: 404
  },
  [ErrorCode.TableNotFound]: {
    code: ErrorCode.TableNotFound,
    message: "Table not found",
    statusCode: 404
  },
  [ErrorCode.TokenExpired]: {
    code: ErrorCode.TokenExpired,
    message: "Token expired",
    statusCode: 401
  },
  [ErrorCode.ValidationError]: {
    code: ErrorCode.ValidationError,
    message: "Invalid request body",
    statusCode: 400
  }
} satisfies Record<ErrorCode, ErrorDefinition>;

export const getErrorDefinition = (code: ErrorCode): ErrorDefinition => {
  return errorCatalog[code];
};
