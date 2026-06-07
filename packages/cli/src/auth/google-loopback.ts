import http from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import open from 'open'

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token'

/** Create a PKCE verifier/challenge pair (S256). */
export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

/**
 * Perform the Google "installed app" PKCE loopback flow and return the Google
 * ID token. Starts a localhost server on an ephemeral port, opens the browser
 * to Google's consent screen, receives the auth code on the loopback, then
 * exchanges it (with the PKCE verifier) for tokens.
 */
export async function getGoogleIdToken(clientId: string): Promise<string> {
  const { verifier, challenge } = createPkcePair()
  const state = randomBytes(16).toString('base64url')

  return new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '', 'http://localhost')
        // Ignore favicon/other stray requests until we see the callback.
        if (!url.searchParams.has('code') && !url.searchParams.has('error')) {
          res.statusCode = 404
          res.end()
          return
        }

        const error = url.searchParams.get('error')
        if (error) {
          res.end('Login failed. You can close this tab and return to the terminal.')
          server.close()
          reject(new Error(`Google returned an error: ${error}`))
          return
        }

        if (url.searchParams.get('state') !== state) {
          res.end('Login failed (state mismatch). You can close this tab.')
          server.close()
          reject(new Error('OAuth state mismatch — possible CSRF, aborting.'))
          return
        }

        const code = url.searchParams.get('code')!
        const port = (server.address() as { port: number }).port
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          redirect_uri: `http://localhost:${port}`,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        })
        const tokenRes = await fetch(GOOGLE_TOKEN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        })
        const json = (await tokenRes.json()) as { id_token?: string; error?: string }
        res.end('Login complete. You can close this tab and return to the terminal.')
        server.close()
        if (json.id_token) resolve(json.id_token)
        else reject(new Error(json.error ?? 'No id_token returned by Google'))
      } catch (e) {
        server.close()
        reject(e)
      }
    })

    server.on('error', reject)

    server.listen(0, () => {
      const port = (server.address() as { port: number }).port
      const authUrl = `${GOOGLE_AUTH}?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: `http://localhost:${port}`,
        response_type: 'code',
        scope: 'openid email profile',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
      })}`
      open(authUrl)
      console.log('Opened your browser to sign in with Google…')
    })
  })
}
