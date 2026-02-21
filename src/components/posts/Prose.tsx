import { Box } from '@chakra-ui/react'
import { commentContentStyles, postContentStyles } from '@/lib/posts/contentStyles'

type ProseProps = {
  children: React.ReactNode
  variant?: 'post' | 'comment'
}

export default function Prose({ children, variant = 'post' }: ProseProps) {
  const textStyle = variant === 'comment' ? 'commentBody' : 'postBody'
  const styles = variant === 'comment' ? commentContentStyles : postContentStyles

  return (
    <Box color="fg" textStyle={textStyle} css={styles}>
      {children}
    </Box>
  )
}
