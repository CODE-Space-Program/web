const getQualifiedUrl = () =>
  typeof window !== "undefined"
    ? window.location.protocol +
      "//" +
      window.location.hostname +
      (window.location.hostname === "localhost"
        ? ":" + window.location.port
        : "")
    : "";

function getGoogleAuthUrl() {
  const clientId =
    "362081384026-k7jclf68lclap0am9qocuoojons27j1d.apps.googleusercontent.com";
  const redirectUri = getQualifiedUrl() + "/api/auth/google/callback";

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  return googleAuthUrl;
}

export function LoginButton() {
  return typeof window !== "undefined" && document.cookie.includes("auth") ? (
    <a href={getGoogleAuthUrl()} aria-label="Login with Google">
      LOGIN
    </a>
  ) : (
    <a href="/api/logout" aria-label="Logout">
      LOGOUT
    </a>
  );
}
