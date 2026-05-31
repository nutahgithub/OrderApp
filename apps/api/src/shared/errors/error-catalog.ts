export const ErrorCode = {
  AdminNotFound: "ADMIN_NOT_FOUND",
  AdminEmailAlreadyExists: "ADMIN_EMAIL_ALREADY_EXISTS",
  AdminSelfAccessChangeForbidden: "ADMIN_SELF_ACCESS_CHANGE_FORBIDDEN",
  AdminRoleAssignmentForbidden: "ADMIN_ROLE_ASSIGNMENT_FORBIDDEN",
  BranchNotEmpty: "BRANCH_NOT_EMPTY",
  BranchNotFound: "BRANCH_NOT_FOUND",
  IdempotencyKeyConflict: "IDEMPOTENCY_KEY_CONFLICT",
  Forbidden: "FORBIDDEN",
  InternalError: "INTERNAL_ERROR",
  InvalidCredentials: "INVALID_CREDENTIALS",
  InvalidOrderCart: "INVALID_ORDER_CART",
  InvalidUpload: "INVALID_UPLOAD",
  InvalidToken: "INVALID_TOKEN",
  MenuInUse: "MENU_IN_USE",
  MenuNotFound: "MENU_NOT_FOUND",
  MissingAuthContext: "MISSING_AUTH_CONTEXT",
  MissingToken: "MISSING_TOKEN",
  OrderAlreadyPaid: "ORDER_ALREADY_PAID",
  OrderCannotBeEdited: "ORDER_CANNOT_BE_EDITED",
  OrderCannotBePaid: "ORDER_CANNOT_BE_PAID",
  OrderInvalidStatusTransition: "ORDER_INVALID_STATUS_TRANSITION",
  OrderNotFound: "ORDER_NOT_FOUND",
  PaymentAmountMismatch: "PAYMENT_AMOUNT_MISMATCH",
  RateLimitExceeded: "RATE_LIMIT_EXCEEDED",
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
  [ErrorCode.AdminEmailAlreadyExists]: {
    code: ErrorCode.AdminEmailAlreadyExists,
    message: "An admin with this email already exists",
    statusCode: 409
  },
  [ErrorCode.AdminSelfAccessChangeForbidden]: {
    code: ErrorCode.AdminSelfAccessChangeForbidden,
    message: "You cannot remove your own admin access",
    statusCode: 403
  },
  [ErrorCode.AdminRoleAssignmentForbidden]: {
    code: ErrorCode.AdminRoleAssignmentForbidden,
    message: "You cannot assign or manage that admin role",
    statusCode: 403
  },
  [ErrorCode.BranchNotEmpty]: {
    code: ErrorCode.BranchNotEmpty,
    message: "Branch cannot be deleted after tables or orders have been created",
    statusCode: 409
  },
  [ErrorCode.BranchNotFound]: {
    code: ErrorCode.BranchNotFound,
    message: "Branch not found",
    statusCode: 404
  },
  [ErrorCode.IdempotencyKeyConflict]: {
    code: ErrorCode.IdempotencyKeyConflict,
    message: "Idempotency key was already used with a different request",
    statusCode: 409
  },
  [ErrorCode.Forbidden]: {
    code: ErrorCode.Forbidden,
    message: "You do not have permission to perform this action",
    statusCode: 403
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
  [ErrorCode.InvalidOrderCart]: {
    code: ErrorCode.InvalidOrderCart,
    message: "Order cart contains unavailable items",
    statusCode: 400
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
  [ErrorCode.MenuInUse]: {
    code: ErrorCode.MenuInUse,
    message: "Menu item cannot be deleted after it has been ordered",
    statusCode: 409
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
  [ErrorCode.OrderAlreadyPaid]: {
    code: ErrorCode.OrderAlreadyPaid,
    message: "Order is already paid",
    statusCode: 409
  },
  [ErrorCode.OrderCannotBeEdited]: {
    code: ErrorCode.OrderCannotBeEdited,
    message: "Paid or cancelled order cannot be edited",
    statusCode: 409
  },
  [ErrorCode.OrderCannotBePaid]: {
    code: ErrorCode.OrderCannotBePaid,
    message: "Cancelled order cannot be paid",
    statusCode: 409
  },
  [ErrorCode.OrderInvalidStatusTransition]: {
    code: ErrorCode.OrderInvalidStatusTransition,
    message: "Order status transition is not allowed",
    statusCode: 409
  },
  [ErrorCode.OrderNotFound]: {
    code: ErrorCode.OrderNotFound,
    message: "Order not found",
    statusCode: 404
  },
  [ErrorCode.PaymentAmountMismatch]: {
    code: ErrorCode.PaymentAmountMismatch,
    message: "Payment amount must match order total",
    statusCode: 400
  },
  [ErrorCode.RateLimitExceeded]: {
    code: ErrorCode.RateLimitExceeded,
    message: "Too many requests. Please try again later.",
    statusCode: 429
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
