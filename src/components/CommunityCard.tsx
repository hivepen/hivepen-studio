import { Button } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import ProfileBanner from '@/components/ProfileBanner'
import { type HiveCommunity } from '@/lib/hive/client'
import { type AccountProfile } from '@/features/profile/profileTypes'
import { hiveAvatarUrl } from '@/lib/posts/tagColorConfig'
import { m } from '@/paraglide/messages'

type CommunityCardProps = {
  community: HiveCommunity
  profile?: AccountProfile
}

const CommunityCard = ({ community, profile }: CommunityCardProps) => {
  const communityId = community.name || community.id
  const title = community.title || community.name || community.id

  return (
    <Link to="/communities/$communityId" params={{ communityId }}>
      <ProfileBanner
        title={title}
        subtitle={communityId ? `@${communityId}` : undefined}
        description={community.about}
        avatarName={communityId}
        avatarUrl={
          profile?.profileImage ||
          (communityId ? hiveAvatarUrl(communityId) : undefined)
        }
        coverUrl={profile?.coverImage}
        size="compact"
        actions={
          communityId ? (
            <Button asChild size="sm" colorPalette="gray" boxShadow="0 0 0 4px white" onClick={(e)=>e.stopPropagation()}>
              <Link to="/communities/$communityId" params={{ communityId }}>
                {m.communities_view_button()}
              </Link>
            </Button>
          ) : null
        }
      />
    </Link>
  )
}

export default CommunityCard
