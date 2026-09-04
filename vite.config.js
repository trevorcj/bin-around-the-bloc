import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import process from 'node:process'

function paystackVerificationPlugin() {
  return {
    name: 'paystack-verification-api',
    configureServer(server) {
      server.middlewares.use('/api/verify-payment', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => {
          body += chunk
        })

        req.on('end', () => {
          try {
            const { reference } = JSON.parse(body || '{}')
            if (!reference) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Transaction reference is required' }))
              return
            }

            const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_e3acbcdab1bd0c27f079cdebd76ab6f80c04aea1'

            const options = {
              hostname: 'api.paystack.co',
              port: 443,
              path: `/transaction/verify/${encodeURIComponent(reference)}`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'User-Agent': 'BinAroundTheBloc/1.0',
              },
            }

            const paystackReq = https.request(options, paystackRes => {
              let data = ''
              paystackRes.on('data', chunk => {
                data += chunk
              })
              paystackRes.on('end', () => {
                res.statusCode = paystackRes.statusCode || 200
                res.setHeader('Content-Type', 'application/json')
                res.end(data)
              })
            })

            paystackReq.on('error', err => {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Paystack verification failed', details: err.message }))
            })

            paystackReq.end()
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY

  return {
    plugins: [react(), tailwindcss(), paystackVerificationPlugin()],
  }
})


