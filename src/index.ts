import '@phala/wapo-env'
import { Hono } from 'hono/tiny'
import { handle } from '@phala/wapo-env/guest'
import { html } from 'hono/html'

export const app = new Hono()

// Define the expected response interfaces
interface AnthropicResponse {
  completion?: string
  stop_reason?: string
  model?: string
  log_id?: string
  error?: {
    type: string
    message: string
    code?: string
  }
}

interface AnthropicErrorResponse {
  error: {
    message?: string
  }
}

async function getChatCompletion(
  anthropicApiKey: string,
  anthropicModel: string,
  query: string
): Promise<string> {
  let result = ''
  try {
    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': anthropicApiKey,
        'anthropic-version': '2023-06-01', 
      },
      body: JSON.stringify({
        prompt: `\n\nHuman: ${query}\n\nAssistant:`,
        model: anthropicModel,
        max_tokens_to_sample: 1024,
        stop_sequences: ['\n\nHuman:'],
      }),
    })

    if (!response.ok) {
      const errorResponse = (await response.json()) as AnthropicErrorResponse
      console.error('API Error Response:', errorResponse)
      result = `API Error: ${errorResponse.error?.message || response.statusText}`
      return result
    }

    const responseData = (await response.json()) as AnthropicResponse

    if (responseData.completion) {
      result = responseData.completion.trim()
    } else if (responseData.error) {
      result = `Error from API: ${responseData.error.message}`
    } else {
      result = 'Failed to get result'
    }
  } catch (error) {
    console.error('Error fetching chat completion:', error)
    result = String(error)
  }
  return result
}

// GET route to display the question and response
app.get('/', async (c) => {
  let result = { message: '' }
  let secrets: Record<string, unknown> = {}
  try {
    secrets = JSON.parse(process.env.secret || '{}')
  } catch (e) {
    console.error('Error parsing secrets:', e)
    return c.html(html`<p>Failed to parse secrets</p>`)
  }
  const anthropicApiKey = secrets.anthropicApiKey ? (secrets.anthropicApiKey as string) : ''
  const anthropicModel = 'claude-2'
  const query = 'Who are you?'

  result.message = await getChatCompletion(anthropicApiKey, anthropicModel, query)

  return c.html(html`<!DOCTYPE html>
    <html>
      <head>
        <title>Anthropic AI Agent</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 2em;
            background-color: #f0f0f0;
          }
          .container {
            background-color: #fff;
            padding: 2em;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
          }
          .question {
            font-weight: bold;
            margin-bottom: 1em;
          }
          .response {
            margin-top: 1em;
            padding: 1em;
            background-color: #e8f4ea;
            border-radius: 8px;
            border: 1px solid #cce3d0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Anthropic AI Agent</h1>
          <p class="question">Question: ${query}</p>
          <div class="response">
            <h2>Response:</h2>
            <p>${result.message}</p>
          </div>
        </div>
      </body>
    </html>`)
})

export default handle(app)
