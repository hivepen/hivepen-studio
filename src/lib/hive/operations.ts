const APP_ID = 'hivepen-studio/0.1'

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const createPermlink = (seed: string) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const slug = toSlug(seed).slice(0, 48) || 'post'
  return `${slug}-${stamp}`
}

const normalizeTags = (raw: string) =>
  raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)

export type PostPayload = {
  author: string
  title: string
  body: string
  tags: string
  community?: string
  summary?: string
  thumbnail?: string
  beneficiaries?: Array<{ account: string; weight: number }>
}

export type CommentPayload = {
  author: string
  parentAuthor: string
  parentPermlink: string
  body: string
}

export const buildPostOperations = (payload: PostPayload) => {
  const tags = normalizeTags(payload.tags)
  const primaryTag = tags[0] ?? 'blog'
  const community = payload.community?.trim()
  const parentPermlink = community && community.length > 0 ? community : primaryTag

  const permlink = createPermlink(payload.title)

  const metadata = {
    app: APP_ID,
    tags,
    ...(community ? { community } : {}),
    ...(payload.thumbnail ? { image: [payload.thumbnail] } : {}),
    ...(payload.summary ? { description: payload.summary } : {}),
  }

  const operations: unknown[] = [
    [
      'comment',
      {
        parent_author: '',
        parent_permlink: parentPermlink,
        author: payload.author,
        permlink,
        title: payload.title,
        body: payload.body,
        json_metadata: JSON.stringify(metadata),
      },
    ],
  ]

  if (payload.beneficiaries && payload.beneficiaries.length > 0) {
    operations.push([
      'comment_options',
      {
        author: payload.author,
        permlink,
        max_accepted_payout: '1000000.000 HBD',
        percent_hbd: 10000,
        allow_votes: true,
        allow_curation_rewards: true,
        extensions: [
          [
            0,
            {
              beneficiaries: payload.beneficiaries.map((entry) => ({
                account: entry.account,
                weight: entry.weight,
              })),
            },
          ],
        ],
      },
    ])
  }

  return { operations, permlink }
}

export const buildCommentOperations = (payload: CommentPayload) => {
  const permlink = createPermlink(
    `${payload.parentAuthor}-${payload.parentPermlink}`
  )

  const metadata = {
    app: APP_ID,
  }

  return [
    [
      'comment',
      {
        parent_author: payload.parentAuthor,
        parent_permlink: payload.parentPermlink,
        author: payload.author,
        permlink,
        title: '',
        body: payload.body,
        json_metadata: JSON.stringify(metadata),
      },
    ],
  ]
}

export const parseTags = normalizeTags

export const buildVoteOperation = ({
  voter,
  author,
  permlink,
  weight,
}: {
  voter: string
  author: string
  permlink: string
  weight: number
}) => [
  'vote',
  {
    voter,
    author,
    permlink,
    weight,
  },
]
