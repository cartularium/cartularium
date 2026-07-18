---
name: AI
category: google
engines:
  gsheets:
    status: available
coverage: out-of-scope
syntax: AI(“prompt”,[optional range])
status: imported
description: The AI function queries Gemini given a prompt and context from a Google Sheet.
aliases:
  - docs/GEMINI
tags: []
---

> [!ATTENTION]
> This article refers to Google Workspace Labs, which is a trusted tester program for users to try new AI features. You can sign up for Google Workspace Labs [here](https://workspace.google.com/labs-sign-up/).

> [!WARNING]
> This article, although originally generated from an [official source](https://support.google.com/docs/answer/15820999), was not a documentation article.

> [!INFO]
> The `GEMINI` function is an alias for `AI`.

The `AI` function queries [Gemini](https://en.wikipedia.org/wiki/Gemini_(language_model)) given a prompt and context from a Google Sheet. This model is [tool-calling](https://www.ibm.com/think/topics/tool-calling) and can access the web.

Unlike other functions, the `AI` function does not update its output when its dependencies change.

### Use the AI function in Sheets

![An animation that demonstrates how to use the AI function by describing the desired action with a specific prompt.](https://storage.googleapis.com/support-kms-prod/vTTDnB8vMxl9BYIhvu6UZBDd7861OMksc4kf)

You can use the AI function to:

* **Generate text:** To generate text tailored to your data, Google Workspace with Gemini uses relevant information from your sheet.
* **Summarize information:** To help you understand your data, Google Workspace with Gemini analyzes the content of your spreadsheet and extracts important key takeaways.
* **Categorize information:** To help you detect patterns, Google Workspace with Gemini categorizes your data into groups. This includes sentiment analysis.
* **Access real-time information:** To automatically generate accurate and timely answers, Google Workspace with Gemini provides up-to-date information from Google Search.

1. On your computer, open a spreadsheet from [Google Sheets](https://docs.google.com/spreadsheets/u/0/).
2. In a cell, enter an AI function. You can use either “=AI()” or “=Gemini()”.
   * For example: `=AI(“Generate slogan for event in 10 words or less”, A2)`
   * Or, at the top of the spreadsheet, click **Insert** ![and then](https://lh3.googleusercontent.com/3_l97rr0GvhSP2XV5OoCkV2ZDTIisAOczrSdzNCBxhIKWrjXjHucxNwocghoUa39gw=w36-h36) **Function** ![and then](https://lh3.googleusercontent.com/3_l97rr0GvhSP2XV5OoCkV2ZDTIisAOczrSdzNCBxhIKWrjXjHucxNwocghoUa39gw=w36-h36) **AI**.
3. Select the cell or cells with an AI function.
4. Click **Generate and Insert**.
5. Optional: To refresh output, click **Refresh and Insert**.

**Tip:** When you click “Generate and Insert” or “Refresh and Insert,” generated content is inserted and the cell edit is attributed to you in version history.

### Add an AI column to a table

When you add an AI column to a table, its first non-header row automatically shows the AI function. After you enter a specific function in that row, you can autofill the rest of the column with the same function and generate entries.

To add an AI column, at the top right of the last column in the table, click Insert AI column right ![](https://storage.googleapis.com/support-kms-prod/nDHdodQqXK8ChLmL7XG9Nt9SPyPBK076K9hg).

### Check some examples

* **Generate new text**
  + `=AI(“Generate slogan for event in 10 words or less”, A2)`
  + `=AI("Create an email to the reviewer addressing specific items in their reviews.", A2:G2)`
  + `=AI("develop a list of keywords for the job title based on the summary of duties.", A2:C2)`
* **Summarize input cell or range**
  + `=AI("For the customer, write a one sentence summary of their feedback.", A2:D2)`
  + `=AI("You are the owner of a pet sitting business. Write a 2 sentence summary for the customer about their pet’s last stay. Be a little funny.", F2)`
  + `=AI("List in bullet points the main themes of the book summary.", D2)`
* **Categorize inputs based on given definitions or generic categories**
  + `=AI("Classify the preview as either a spam email or not a spam email.", D2)`
  + `=AI("Categorize the customer inquiry as a compliment, exchange request, or return request.",C2)`
  + `=AI("Classify the restaurant by which New York City borough it belongs to. Use the neighborhood to help.", A2:C2)`
* **Analyze sentiment**
  + `=AI("Classify the sentiment of the realtor analysis.”, D2)`
  + `=AI("Perform sentiment analysis on the emails sent by the customers to the barbershop.", C2)`
  + `=AI("Classify the body of the email, as either positive, negative, or neutral.", D2)`
* **Get up-to-date information from the web**
  + `=AI("What is the current capital of Kazakhstan?", A2)`
  + `=AI("What is the population of the list capital city?", A2:B2)`
  + `=AI("What is the birthday of the author who wrote the associated book. Only output the date", A2:B2")`

**Tip:** If you want to refer to two ranges that aren’t contiguous, you can use concatenation in the prompt. However, if there’s a change in the data in ranges that are part of the prompt, you don’t get a prompt to refresh the data.

For example, if you use the function `=AI("Find the major themes in the customer feedback of "&B2&" using the comments: "&D2&"")`, when B2 or D2 change, you need to manually determine when to refresh the data.

### Syntax

```gse
AI(“prompt”,[optional range])
```

* **Prompt:** A specific prompt that describes your desired action.
* **Range:** This is optional. It’s the range that the prompt refers to when it generates data.

### Give feedback about the AI function

Google Workspace with Gemini is constantly learning and may not be able to support your request.

If you get a suggestion that’s inaccurate or that you feel is unsafe, you can let us know by submitting feedback. Your feedback can help improve AI-assisted Workspace features and broader Google efforts in AI.

Because feedback may be human readable, do not submit data that contains personal, confidential, or sensitive information.

1. At the bottom right of the generated text, click Good suggestion ![](https://storage.googleapis.com/support-kms-prod/7j7OkRZfOcT69Vz6rrOiSRTPFjmKhseJIom5) or Bad suggestion ![](https://storage.googleapis.com/support-kms-prod/jyZQMHVBqIlMeIxVgJQZSo1iOp4iheXGMHa5).
2. In the pop-up window, you can select the data you want to share along with your feedback, which includes:
   * Prompts
   * Ranges
     + Only the referenced cells are collected and their context isn't shared.
   * Outputs
3. If you don’t want to share certain data, you can uncheck it.
   * If you select Bad suggestion ![](https://storage.googleapis.com/support-kms-prod/jyZQMHVBqIlMeIxVgJQZSo1iOp4iheXGMHa5), to select the issue you found and enter additional feedback, click **Next**.
   * If you select Good suggestion ![](https://storage.googleapis.com/support-kms-prod/7j7OkRZfOcT69Vz6rrOiSRTPFjmKhseJIom5), click **Submit**.

To provide general feedback on this feature, at the top, click **Help** ![and then](https://lh3.googleusercontent.com/3_l97rr0GvhSP2XV5OoCkV2ZDTIisAOczrSdzNCBxhIKWrjXjHucxNwocghoUa39gw=w36-h36) **Help Sheets improve**.

To report a legal issue, [create a request](https://support.google.com/legal/answer/3110420).

### Learn about the limitations of the AI functions

* Responses are limited to text.
* The AI function doesn’t have access to your entire spreadsheet or other files in your Google Drive.
  + To provide data or context to your prompt, add the data to your current spreadsheet and use the optional range argument. This is highly recommended to improve output quality.
* You can’t undo or redo your function.
  + You can regenerate your output instead.
* You can’t have more than one function with the same name in Sheets. If you build a custom function with the name “=AI()” or “=Gemini(),” the custom function remaps to the Sheets AI function.
* Embedded AI functions aren’t supported.
  + For example: `=IF(AI(“sentiment analysis”, A2)),”negative”,0)`
* If “AI function not available” shows, it could mean that:
  + You're not a participant in the Workspace Labs program or you’re not on a Workspace plan with access to AI functions.
  + You don’t have access to the AI function because of your Admin settings or your language setting. [Learn how to change your language setting](https://support.google.com/accounts/answer/32047).
* The AI function has short term and long term generation limits. If you reach a long term limit, you temporarily can’t click “Generate.” You can wait for 24 hours and then try again.
* You can select multiple cells with AI functions and generate outputs; however, only the first 200 selected cells with AI functions will be generated. You can wait for the generation to complete and select more cells to generate outputs.
* You can’t generate content with the AI function if you access Sheets with other cloud storage providers like Box, Dropbox, or Egnyte with Google Drive. [Learn how to use Google Docs, Sheets & Slides with Box, Dropbox, or Egnyte](https://support.google.com/drive/answer/9191990).

### Turn off the AI function

To turn off any of the features on Google Workspace Labs, you must exit Workspace Labs. If you exit, you can’t rejoin Workspace Labs and permanently lose access to [all Workspace Labs features](https://support.google.com/docs/answer/13447104).

[Learn how to exit Workspace Labs](https://support.google.com/docs/answer/13447104?sjid=3066267152506265237-NA#labs-opt-out&exit-labs-docs&exit-labs-gmail&zippy=%2Chow-to-exit-from-google-docs-slides%2Chow-to-exit-from-gmail).

If you use AI functions after you exit Workspace Labs:

* The error “AI function not available” shows.
* You can’t generate output with AI functions.

### Learn about Workspace Labs feature suggestions

* Workspace Labs feature suggestions don’t represent Google’s views, and should not be attributed to Google.
* Don’t rely on Workspace Labs features as medical, legal, financial or other professional advice.
* Workspace Labs features may suggest inaccurate or inappropriate information. Your feedback makes Workspace Labs more helpful and safe.
* Don’t include personal, confidential, or sensitive information in your prompts.
* Google uses Workspace Labs data and metrics to provide, improve, and develop products, services, and machine learning technologies across Google.
* Your Workspace Labs Data may also be read, rated, annotated, and reviewed by human reviewers. Importantly, where Google uses Google-selected input (as described in the Privacy Notice) to generate output, Google will aggregate and/or pseudonymize that content and resulting output before it is viewed by human reviewers, unless it is specifically provided as part of your feedback to Google.

### How Workspace Labs data in Google Sheets is collected

When you use the AI function in Sheets, Google uses and stores the following data:

* The prompts you enter
* The generated text
* Google Workspace content that you have access to that is referenced to generate content (both Google-selected input and user-provided input).
* Your feedback on the AI functions

To understand how this data is used, review the [Google Workspace Labs Privacy Notice and Terms for Personal Accounts](https://support.google.com/docs/answer/13447401).

### Notes
- The `AI` function is not allowed to [[Dependency|depend]] on a [[Volatile]] function.

### Related resources

* [Get started with Google Workspace Labs](https://support.google.com/docs/answer/13447104)
* [Collaborate with Gemini in Google Sheets (Workspace Labs)](https://support.google.com/docs/answer/14218565)
* [Google Workspace Labs Privacy Notice and Terms for Personal Accounts](https://support.google.com/docs/answer/13447401)
