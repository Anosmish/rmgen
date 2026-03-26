import Link from "next/link";

const messages: Record<string, string> = {
  AccessDenied: "GitHub authorization was denied. Please try again.",
  Configuration: "Authentication configuration is invalid. Check your environment variables.",
  OAuthSignin: "Unable to start GitHub sign-in flow.",
  OAuthCallback: "GitHub returned an invalid callback response.",
  OAuthCreateAccount: "Failed to link your OAuth account.",
  EmailCreateAccount: "Failed to create account using email provider.",
  Callback: "Authentication callback failed.",
  OAuthAccountNotLinked: "This email is linked to another sign-in method.",
  SessionRequired: "You must sign in to access this page.",
  Default: "Something went wrong while signing in.",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error ?? "Default";
  const message = messages[error] ?? messages.Default;

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
      <div className="rounded-2xl border border-rose-800/40 bg-rose-950/30 p-8 text-center">
        <h1 className="text-2xl font-semibold text-rose-200">Authentication Error</h1>
        <p className="mt-3 text-sm text-rose-100/85">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-rose-50 transition hover:bg-rose-400"
          >
            Back to login
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-rose-200/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/10"
          >
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
