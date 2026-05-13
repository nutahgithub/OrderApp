export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type HealthResponse = {
  status: "ok";
  service: string;
};

