import HiveIconLucide from './HiveIconLucide'
import type { HiveIconProps } from '@/components/hive/HiveIcon'
import HiveIcon from '@/components/hive/HiveIcon'

export default function HbdIcon(props: HiveIconProps) {
  return <HiveIcon color="green.fg" colorPalette="green" {...props} />
}

export function HbdIconLucide(props: HiveIconProps) {
  return <HiveIconLucide color="green.fg" colorPalette="green" {...props} />
}
