# iPhone Shortcut setup

**Shortcut name:** `Log Food Reaction`  
**Trigger:** hold iPhone side button, then say “Log Food Reaction” (wake-word listening need not be enabled).

Build these actions **top to bottom**:

1. **Dictate Text** → captures a spoken description.
2. **URL Encode** → input is the *Dictated Text* variable.
3. **Text** → insert `YOUR_PRIVATE_DEPLOYMENT_EXEC_URL?voice=VOICEENTRY`.
4. **Replace Text** → replace literal `VOICEENTRY` **with** the linked *URL Encoded Text* variable **in** the Text action from step 3. Disable Regular Expression.
5. **URL** → input is the *Updated Text* variable produced by Replace Text, **not** the URL from step 3.
6. **Open URLs** → input is the URL action from step 5.

Run a safe synthetic test: “I ate two crackers at 9 AM. Two hours later I had mild bloating.” The web app provides a review link to Google Forms; **inspect then submit**. The example test should not be submitted to your actual diary.

Do not copy a real deployment URL into GitHub. Query parameters may appear in history, server/request logs, shared screenshots, and browser sync. For stronger privacy, replace GET query-string transmission with an authenticated POST-based design before using sensitive descriptions.
