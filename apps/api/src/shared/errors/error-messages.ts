import { ErrorCode, errorCatalog } from "./error-catalog.js";

export const errorMessages = {
  [ErrorCode.AdminNotFound]: errorCatalog[ErrorCode.AdminNotFound].message,
  [ErrorCode.InternalError]: errorCatalog[ErrorCode.InternalError].message,
  [ErrorCode.InvalidCredentials]: errorCatalog[ErrorCode.InvalidCredentials].message,
  [ErrorCode.InvalidToken]: errorCatalog[ErrorCode.InvalidToken].message,
  [ErrorCode.MissingAuthContext]: errorCatalog[ErrorCode.MissingAuthContext].message,
  [ErrorCode.MissingToken]: errorCatalog[ErrorCode.MissingToken].message,
  [ErrorCode.RouteNotFound]: errorCatalog[ErrorCode.RouteNotFound].message,
  [ErrorCode.TokenExpired]: errorCatalog[ErrorCode.TokenExpired].message,
  [ErrorCode.ValidationError]: errorCatalog[ErrorCode.ValidationError].message
};
