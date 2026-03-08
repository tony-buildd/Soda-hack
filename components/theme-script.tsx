// Inline script to prevent FOUC (flash of unstyled content) on page load.
// Reads theme from localStorage before React hydrates and sets the dark class.
// NOTE: This uses dangerouslySetInnerHTML intentionally — the string is a
// hardcoded literal with zero user input, making XSS impossible.
export function ThemeScript() {
  const code = [
    "(function(){",
    'try{var t=localStorage.getItem("theme");',
    'if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme:dark)").matches))',
    '{document.documentElement.classList.add("dark")}',
    "}catch(e){}",
    "})()",
  ].join("");

  // eslint-disable-next-line react/no-danger -- safe: hardcoded string, no user data
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: code }} />;
}
