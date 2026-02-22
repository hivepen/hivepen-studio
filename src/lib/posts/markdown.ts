import { marked } from 'marked'
import createDOMPurify from 'dompurify'
import sanitizeHtml from 'sanitize-html'

const linkifyMentions = (text: string) =>
  text.replace(/(^|[^\\w/])@([a-z0-9.-]+)/gi, '$1[@$2](/profile/$2)')

const linkifyTags = (text: string) =>
  text.replace(/(^|[^\\w/])#([a-z0-9-]+)/gi, '$1[#$2](/search?tag=$2)')

const protectMarkdownLinks = (text: string) => {
  const tokens: string[] = []
  let output = text
  const patterns = [/!\[[^\]]*]\([^)]+\)/g, /\[[^\]]+]\([^)]+\)/g]

  patterns.forEach((pattern) => {
    output = output.replace(pattern, (match) => {
      const token = `__MD_LINK_${tokens.length}__`
      tokens.push(match)
      return token
    })
  })

  return { output, tokens }
}

const restoreMarkdownLinks = (text: string, tokens: string[]) =>
  tokens.reduce(
    (acc, value, index) => acc.replace(`__MD_LINK_${index}__`, value),
    text
  )

const protectHtmlTags = (text: string) => {
  const tokens: string[] = []
  const output = text.replace(/<[^>]+>/g, (match) => {
    const token = `__HTML_TAG_${tokens.length}__`
    tokens.push(match)
    return token
  })
  return { output, tokens }
}

const restoreHtmlTags = (text: string, tokens: string[]) =>
  tokens.reduce(
    (acc, value, index) => acc.replace(`__HTML_TAG_${index}__`, value),
    text
  )

const linkifyUrls = (text: string) =>
  text.replace(
    /(^|[^\w])((https?:\/\/)[^\s<]+[^\s<\.)])/gi,
    '$1[$2]($2)'
  )

const injectImageProxy = (html: string) =>
  html.replace(
    /<img\s+[^>]*src="([^"]+)"[^>]*>/gi,
    (match, src) => {
      if (!src || src.startsWith('https://images.hive.blog')) {
        return match
      }
      const proxied = `https://images.hive.blog/0x0/${src}`
      return match.replace(src, proxied)
    }
  )

const toCallout = (type: string, content: string) => {
  const title = type.charAt(0) + type.slice(1).toLowerCase()
  return `<div class="callout callout-${type.toLowerCase()}"><strong>${title}</strong> ${content}</div>`
}

const toSpoiler = (content: string) =>
  `<details class="spoiler"><summary>Spoiler</summary><p>${content}</p></details>`

const preprocessBlocks = (source: string) =>
  source
    .replace(
      /<center>\s*!\[([^\]]*)]\(([^)]+)\)\s*<\/center>/gi,
      (_match, alt, url) =>
        `<div class="md-center"><img src="${url}" alt="${alt}" /></div>`
    )
    .split('\n')
    .map((line) => {
      const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|WARNING|INFO)\]\s*(.*)$/i)
      if (calloutMatch) {
        const [, type, rest] = calloutMatch
        return toCallout(type.toUpperCase(), rest)
      }
      const spoilerMatch = line.match(/^>!\s*(.*)$/)
      if (spoilerMatch) {
        return toSpoiler(spoilerMatch[1])
      }
      return line
    })
    .join('\n')

const injectEmbeds = (html: string) => {
  const youtubeRegex =
    /<p>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)|https?:\/\/youtu\.be\/([\w-]+))\s*<\/p>/gi
  const withYouTube = html.replace(youtubeRegex, (_match, _url, id1, id2) => {
    const id = id1 || id2
    return `<div class="embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
  })

  const threeSpeakRegex =
    /<p>\s*(https?:\/\/(?:www\.)?3speak\.tv\/watch\?v=([\w.-]+\/[\w.-]+))\s*<\/p>/gi
  return withYouTube.replace(threeSpeakRegex, (_match, _url, id) => {
    return `<div class="embed"><iframe src="https://3speak.tv/embed?v=${id}" title="3Speak video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
  })
}

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
})

let domPurifyInstance: ReturnType<typeof createDOMPurify> | null = null

const getDomPurify = () => {
  if (typeof window === 'undefined') return null
  if (!domPurifyInstance) domPurifyInstance = createDOMPurify(window)
  return domPurifyInstance
}

const sanitizeClient = (html: string) =>
  getDomPurify()?.sanitize(html, {
    ADD_TAGS: ['iframe', 'details', 'summary'],
    ADD_ATTR: [
      'allow',
      'allowfullscreen',
      'frameborder',
      'loading',
      'scrolling',
      'src',
      'title',
      'class',
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-]|$))/i,
  }) ?? html

const sanitizeServer = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'iframe',
      'details',
      'summary',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      iframe: [
        'allow',
        'allowfullscreen',
        'frameborder',
        'loading',
        'scrolling',
        'src',
        'title',
      ],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      details: ['class'],
      summary: ['class'],
      img: ['src', 'alt', 'title', 'loading', 'width', 'height', 'class'],
      a: ['href', 'name', 'target', 'rel', 'class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: true,
  })

export const renderHiveMarkdown = (content: string) => {
  const preprocessed = preprocessBlocks(content ?? '')
  const protectedHtml = protectHtmlTags(preprocessed)
  const protectedLinks = protectMarkdownLinks(protectedHtml.output)
  const linked = linkifyUrls(
    linkifyTags(linkifyMentions(protectedLinks.output))
  )
  const restoredLinks = restoreMarkdownLinks(linked, protectedLinks.tokens)
  const safeSource = restoreHtmlTags(restoredLinks, protectedHtml.tokens)
  const html = marked.parse(safeSource)
  const withProxy = injectImageProxy(html)
  const withEmbeds = injectEmbeds(withProxy)
  return import.meta.env.SSR
    ? sanitizeServer(withEmbeds)
    : sanitizeClient(withEmbeds)
}
