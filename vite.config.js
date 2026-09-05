import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

function paystackApiPlugin() {
  return {
    name: 'paystack-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || ''
        const pathname = rawUrl.split('?')[0]

        if (!pathname.startsWith('/api/')) {
          next()
          return
        }

        const endpoint = pathname.slice('/api/'.length).replace(/\/$/, '')
        const endpointFileMap = {
          'verify-payment': './api/verify-payment.js',
          'banks': './api/banks.js',
          'resolve-account': './api/resolve-account.js',
          'subaccount': './api/subaccount.js',
        }

        const filePath = endpointFileMap[endpoint]
        if (!filePath) {
          next()
          return
        }

        try {
          const mod = await import(filePath)
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            req.body = body
            try {
              await mod.default(req, res)
            } catch (err) {
              if (!res.writableEnded) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            }
          })
        } catch {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY

  return {
    plugins: [react(), tailwindcss(), paystackApiPlugin()],
  }
})


