import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  rollupConfig: {
    external: ['sanitize-html'],
  },
})
