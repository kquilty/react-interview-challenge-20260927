## Questions

### What issues, if any, did you find with the existing code?

- None of the withdrawal/deposit rules existed, so you could withdraw far more than the account
  had, do negative deposits, decimals, etc...
- One tricky (but classic) bug: The routes validated the request with Joi but then used the original
  request body instead of Joi's result. Sending the amount as a string caused it to be appended
  as text (so a $1900 balance became `190050`)
- The UI didn't check whether a request failed. I just put in a simple check and alert.
- Withdrawing from an account that doesn't exist returned a 400 instead of a 404.
- Validation errors came back as plain text while other errors came back as JSON, so
  the UI would have needed to handle both.
- The balance update reads the balance, calculates the new one in code, then writes it
  back. Two requests at the same time could overwrite each other. This is probably one of the main things
  I would fix next if this was going to production.

### What issues, if any, did you find with the request to add functionality?

A few things weren't spelled out, so I made these calls:

- **"A single day"** — I used the calendar day rather than a rolling 24 hours which is probably more realistic
- **$5 bills** — withdrawals must be a multiple of $5. This doesn't apply to deposits. Assuming this is intentional.
- **Invalid amounts** — zero, negative, and decimal amounts are rejected. The database
  stores whole dollars, so I kept it that way.
- **Tracking the daily limit** — there was no history of withdrawals, so I added a
  `withdrawals` table. Not really NEEDED before, but needed now with the new functionality.

### Would you modify the structure of this project if you were to start it over? If so, how?

- I'd put the business rules in their own module so they could be unit tested without a DB.
- I'd store every transaction instead of only the current balance. It gives you a
  history and makes rules like the daily limit easier.

### Were there any pieces of this project that you were not able to complete that you'd like to mention?

- The race condition mentioned above isn't fixed. Two withdrawals at the exact same time
  could both get past the daily limit check. The fix would be to wrap each transaction in
  a database transaction and lock the account row.

### If you were to continue building this out, what would you like to add next?

- Automated tests: unit tests for the withdrawal/deposit rules first, then a small
  Playwright suite covering sign-in, a deposit, a withdrawal, and each rule being rejected.
- Show errors on the page instead of using `alert()`
- disable the buttons while a request is in progress.
- A transaction history on the dashboard.

### If you have any other comments or info you'd like the reviewers to know, please add them below.

- I kept my changes small and inside the existing files so the diff is easy to review.
- This was a fun project and I'm excited to talk about it!
