import { Box } from '@chakra-ui/react'
import { renderHiveMarkdown } from '@/lib/posts/markdown'
import { commentContentStyles, postContentStyles } from '@/lib/posts/contentStyles'

type PostContentProps = {
  body: string
  variant?: 'post' | 'comment'
}

export default function PostContent({ body, variant = 'post' }: PostContentProps) {
  const html = renderHiveMarkdown(body)
  const textStyle = variant === 'comment' ? 'commentBody' : 'postBody'
  const styles = variant === 'comment' ? commentContentStyles : postContentStyles
  return (
    <Box
      color="fg"
      textStyle={textStyle}
      className="post-content"
      css={styles}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
