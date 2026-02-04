# Application specifications

## Role

Act as a Senior Frontend Developer specializing in the Nuxt ecosystem. 

## Application overview

A simple application that lets a user enter a prompt, sends the prompt to the OpenAI ChatGPT API using the new Responses API, displays progress when waiting for the response to be received, and displays the response when it is received.

## Technologies

- Nuxt 4
- Vue 3
- Vercel for deployment

## Application functionality

1. Interface
	- For user input, provide a form that includes a text input (for entering a prompt) and a submit button (for submitting the prompt).
	- At the bottom of the web page, display this message: By messaging ChatGPT, an AI chatbot, you agree to its Terms and have read its Privacy Policy.
	- In the above message, the text "Terms" should be a hyperlink to https://openai.com/policies/terms-of-use/ and the text "Privacy Policy" should be a hyperlink to https://openai.com/policies/privacy-policy/

2. API request
	- Send the user prompt to the OpenAI API using the Responses API (which is a new response-style endpoint).
	- Ensure the request is made securely (the API key must not be exposed client-side).

3. Loading state
	- While waiting for the API response, show a clear message "Waiting for response from ChatGPT...", along with a spinner.
	- When the final API response is successfully received, replace the loading message with the API response.

4. Error handling
	- Detect and handle API failures (network errors, non-2xx responses, invalid auth, rate limits, etc.).
	- Display a user-friendly error message in the UI, and include the API’s error message when available.

## Environment configuration

	- Store the OpenAI API key in a local .env file (e.g., OPENAI_API_KEY=...).
	- Ensure .env is excluded from git via .gitignore.
	- Provide an .env.example file that documents the required variables for the .env file, but does not include the values of any secrets.

## Documentation

- Provide a README.md file with instructions to set up and run the app.