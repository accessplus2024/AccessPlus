import { Youtube, Instagram, Tiktok, Link } from "@iconoir/vue"
import RedditIcon from "@/components/icons/RedditIcon.vue"

const PLATFORM_STYLES = {
  reddit: { icon: RedditIcon, color: "#FF4500" },
  youtube: { icon: Youtube, color: "#FF0000" },
  instagram: { icon: Instagram, color: "#FF0069" },
  tiktok: { icon: Tiktok, color: "#1fb0e0" },
  website: { icon: Link, color: null }, 
}

export function getResourceIcon(platform) {
  return PLATFORM_STYLES[platform] ?? PLATFORM_STYLES.website
}