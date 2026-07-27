type CookieEnvironment = {
  APP_ENV?: string;
  NODE_ENV?: string;
};

export function secureCookiesRequired(
  environment: CookieEnvironment = process.env
) {
  return environment.NODE_ENV === "production" && environment.APP_ENV !== "local";
}
