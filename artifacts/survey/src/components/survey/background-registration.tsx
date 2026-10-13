export const REGISTRATION_URL = "https://health.acs-kw.com/api/c";

/** Request the registration page without navigating the participant away.
 * A frame load cannot confirm registration on a cross-origin service.
 * Keep this component at the same tree position through contact and thank-you
 * so finishing contact does not mount a second frame/request.
 */
export function BackgroundRegistration({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <iframe
      src={REGISTRATION_URL}
      title="Participant registration"
      data-testid="background-registration"
      hidden
      aria-hidden="true"
      tabIndex={-1}
      loading="eager"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
