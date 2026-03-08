import { type Profile } from '@ecency/sdk'
import { type AccountProfile } from '@/features/profile/profileTypes'

export const mapProfile = (profile: Profile): AccountProfile => {
  const metadata = profile.metadata?.profile ?? {}
  return {
    name: profile.name,
    displayName: metadata.name,
    about: metadata.about,
    location: metadata.location,
    website: metadata.website,
    profileImage: metadata.profile_image,
    coverImage: metadata.cover_image,
    reputation: profile.reputation,
    postCount: profile.post_count,
    followerCount: profile.stats?.followers,
    followingCount: profile.stats?.following,
  }
}
