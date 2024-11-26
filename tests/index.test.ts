import { afterAll, describe, expect, test, vi } from 'vitest'
import { app } from '../src/'

// Set testing environment secrets
const anthropicApiKey = JSON.stringify({ anthropicApiKey: 'ANTHROPIC_API_KEY' })
vi.stubEnv('secret', anthropicApiKey)

describe('Test Anthropic AI Agent Contract', () => {
  test('GET Test: Fixed question "Who are you?"', async () => {
    const resp = await app.request('/')
    expect(resp.status).toBe(200)
    expect(resp.headers.get('content-type')?.toLowerCase()).toContain('text/html')
    const data = await resp.text()
    console.log(data)
    expect(data).toContain('Question: Who are you?')
    expect(data).toContain('Response:')
    expect(data).toContain('Anthropic AI Agent')
    expect(data).toContain('<div class="response">')
  })
})

afterAll(async () => {
  console.log(`
Now you are ready to publish your agent, add secrets, and interact with your agent in the following steps:
- Execute: 'npm run publish-agent'
- Set secrets: 'npm run set-secrets'
- Go to the URL produced by setting the secrets.
`)
})
