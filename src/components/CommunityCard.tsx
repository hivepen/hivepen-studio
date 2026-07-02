import { Button } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import type {AccountProfile} from '@/features/profile/profileTypes';
import type {HiveCommunity} from '@/lib/hive/client';
import ProfileBanner from '@/components/ProfileBanner'
import {
  
  getCommunityIdentifier,
  getCommunityLabel
} from '@/lib/hive/client'
import { hiveAvatarUrl } from '@/lib/posts/tagColorConfig'
import { m } from '@/paraglide/messages'

type CommunityCardProps = {
  community: HiveCommunity
  profile?: AccountProfile
  onSelect?: (community: HiveCommunity) => void
}

const CommunityCard = ({
  community,
  profile,
  onSelect,
}: CommunityCardProps) => {
  const communityId = getCommunityIdentifier(community)
  const title = getCommunityLabel(community)

  return (
    <ProfileBanner
      rounded={"xl"}
      title={title}
      subtitle={communityId ? `@${communityId}` : undefined}
      description={community.about}
      avatarName={communityId}
      avatarUrl={
        profile?.profileImage ||
        (communityId ? hiveAvatarUrl(communityId) : undefined)
      }
      avatarShape='squircle'
      coverUrl={profile?.coverImage}
      size="compact"
      actions={
        communityId ? (
          <Button
            asChild
            size="sm"
            colorPalette="gray"
            variant="subtle"
            boxShadow="0 0 0 4px white"
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              to="/communities/$communityId"
              params={{ communityId }}
              onClick={() => onSelect?.(community)}
            >
              {m.communities_view_button()}
            </Link>
          </Button>
        ) : null
      }
    />
  )
}

export default CommunityCard
