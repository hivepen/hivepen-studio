import { Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
  Menu,
  VStack,
  Image,
} from '@chakra-ui/react'
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronRightIcon,
  FilePenLine,
  Home,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  NotebookText,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { getHiveKeychain, signLogin } from '@/lib/hive/keychain'
import { fetchAccount } from '@/lib/hive/client'
import AccountConnectDialog from './AccountConnectDialog'
import { Avatar } from '@/components/ui/avatar'
import { CONNECT_ACCOUNT_DIALOG_EVENT } from '@/lib/ui/connectAccountDialog'

type NavItem = {
  label: string
  to: string
  icon: typeof Home
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Content creation',
    items: [
      { label: 'Write', to: '/editor', icon: NotebookPen },
      { label: 'My blog', to: '/blog', icon: BookOpen },
      { label: 'Drafts', to: '/drafts', icon: NotebookText },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Discover',
    items: [
      { label: 'Search', to: '/search', icon: Search },
      { label: 'Communities', to: '/communities', icon: Users },
      { label: 'Users', to: '/users', icon: Users },
      { label: 'Engagement', to: '/engagement', icon: MessageSquare },
    ],
  },
  {
    label: 'App',
    items: [
      { label: 'Settings', to: '/settings', icon: Settings },
      { label: 'Prototype', to: '/prototype', icon: FilePenLine },
    ],
  },
]

export default function AppShell({
  children,
}: {
  children?: React.ReactNode
}) {
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [collapsed, setCollapsed] = useState(false)
  const [account, setAccount] = useLocalStorageState<string | null>(
    'hivepen.account',
    null
  )
  const [isConnecting, setIsConnecting] = useState(false)
  const [keychainAvailable] = useState(() => Boolean(getHiveKeychain()))
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const accountLabel = useMemo(() => {
    if (!account) return 'Connect account'
    return `@${account}`
  }, [account])

  const breadcrumb = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      drafts: 'Drafts',
      editor: 'Editor',
      blog: 'My blog',
      search: 'Search',
      communities: 'Communities',
      users: 'Users',
      engagement: 'Engagement',
      analytics: 'Analytics',
      settings: 'Settings',
      prototype: 'Prototype',
    }
    if (segments.length === 0) return ['Dashboard']
    return segments.map((segment) => map[segment] ?? segment)
  }, [pathname])

  useEffect(() => {
    const handleOpenConnectDialog = () => setShowConnectDialog(true)
    window.addEventListener(
      CONNECT_ACCOUNT_DIALOG_EVENT,
      handleOpenConnectDialog
    )
    return () => {
      window.removeEventListener(
        CONNECT_ACCOUNT_DIALOG_EVENT,
        handleOpenConnectDialog
      )
    }
  }, [])

  const loadProfileImage = async (username: string) => {
    try {
      const accountData = await fetchAccount(username)
      const metadata = accountData?.json_metadata
        ? JSON.parse(accountData.json_metadata)
        : null
      const image = metadata?.profile?.profile_image as string | undefined
      setProfileImage(image ?? null)
    } catch {
      setProfileImage(null)
    }
  }

  const handleConnect = async (username: string) => {
    if (!keychainAvailable) {
      return
    }
    setIsConnecting(true)
    const message = `Hivepen Studio login ${new Date().toISOString()}`
    const response = await signLogin(username.trim(), message)
    if (response.success) {
      setAccount(username.trim())
      await loadProfileImage(username.trim())
      setShowConnectDialog(false)
    } else {
      window.alert(response.message ?? 'Login rejected by Hive Keychain.')
    }
    setIsConnecting(false)
  }

  const handleLogout = () => {
    setAccount(null)
    setProfileImage(null)
    router.navigate({ to: '/' })
  }

  const handleSwitchAccount = () => {
    setAccount(null)
    setProfileImage(null)
    router.navigate({ to: '/' })
    setShowConnectDialog(true)
  }

  return (
    <Flex minH="100vh" bg="bg">
      <Box
        as="aside"
        w={collapsed ? '84px' : '280px'}
        bg="bg.panel"
        borderRight="1px solid"
        borderColor="border"
        transition="width 0.2s ease"
        position="sticky"
        top={0}
        h="100vh"
      >
        <Flex direction="column" h="100%" px={4} py={5} gap={6}>
          <HStack justify="space-between" align="center">
            <HStack gap={3} overflow="hidden">
              <Box
                w={10}
                h={10}
                overflow="hidden"
              >
                <Image src='https://images.hive.blog/u/hivepen/avatar' alt='Hivepen Studio Isotype'/>
              </Box>
              {!collapsed && (
                <Box>
                  <Text fontWeight="700" letterSpacing="-0.01em">
                    Hivepen Studio
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    Pro publishing suite
                  </Text>
                </Box>
              )}
            </HStack>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </HStack>

          <VStack align="stretch" gap={4} flex="1">
            {navGroups.map((group) => (
              <Box key={group.label}>
                {!collapsed && (
                  <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.14em"
                    color="fg.muted"
                    px={2}
                    mb={2}
                  >
                    {group.label}
                  </Text>
                )}
                <VStack align="stretch" gap={1}>
                  {group.items.map((item) => (
                    <NavButton
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      collapsed={collapsed}
                    />
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>

          <Menu.Root positioning={{ placement: 'top-start' }}>
            <Menu.Trigger asChild>
              <Button
                variant="ghost"
                justifyContent="flex-start"
                w="full"
                gap={3}
                px={3}
                py={6}
              >
                <Avatar
                  size="sm"
                  src={profileImage ?? undefined}
                  name={account ?? 'Guest'}
                />
                {!collapsed && (
                  <Box textAlign="left">
                    <Text fontWeight="600" fontSize="sm">
                      {accountLabel}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {account ? 'Account menu' : 'Connect Hive account'}
                    </Text>
                  </Box>
                )}
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content minW="220px" bg="bg.panel" borderColor="border">
                {!account && (
                  <Menu.Item
                    value="connect"
                    onSelect={() => setShowConnectDialog(true)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect account'}
                  </Menu.Item>
                )}
                <Menu.Item
                  value="switch"
                  onSelect={handleSwitchAccount}
                  disabled={!account}
                >
                  Switch account
                </Menu.Item>
                <Menu.Item
                  value="settings"
                  onSelect={() => router.navigate({ to: '/settings' })}
                  disabled={!account}
                >
                  Account settings
                </Menu.Item>
                <Menu.Item value="logout" onSelect={handleLogout} disabled={!account}>
                  Logout
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Flex>
      </Box>

      <Flex direction="column" flex="1" minW={0} maxH="100vh">
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex={10}
          borderBottom="1px solid"
          borderColor="border"
          bg="bg.panel"
          px={{ base: 6, md: 10 }}
          py={4}
        >
          <HStack gap={2} fontSize="sm" color="fg.muted">
            <Text>Hivepen</Text>
            {breadcrumb.map((item, index) => (
              <HStack key={`${item}-${index}`} gap={2}>
                <Icon color="fg.subtle"><ChevronRightIcon size="14" /></Icon>
                <Text color={index === breadcrumb.length - 1 ? 'fg' : 'fg.muted'}>
                  {item}
                </Text>
              </HStack>
            ))}
          </HStack>
        </Box>
        <Box flex="1" bg="bg.subtle" overflowY="auto">
          {children ?? <Outlet />}
        </Box>
      </Flex>
      <AccountConnectDialog
        open={showConnectDialog}
        onClose={() => setShowConnectDialog(false)}
        onConnect={handleConnect}
        isConnecting={isConnecting}
        keychainAvailable={keychainAvailable}
      />
    </Flex>
  )
}

function NavButton({
  to,
  icon,
  label,
  collapsed,
}: {
  to: string
  icon: typeof Home
  label: string
  collapsed: boolean
}) {
  return (
    <Box
      asChild
      display="flex"
      alignItems="center"
      gap={3}
      px={3}
      py={2.5}
      borderRadius="12px"
      color="fg.muted"
      _hover={{ bg: 'bg.subtle', color: 'fg' }}
    >
      <Link to={to}
      activeProps={{
        style: {
          background: 'var(--chakra-colors-bg-muted)',
          color: 'var(--chakra-colors-fg)',
        },
      }}>
        <Icon as={icon} boxSize={4.5} />
        {!collapsed && (
          <Text fontSize="sm" fontWeight="500">
            {label}
          </Text>
        )}
      </Link>
    </Box>
  )
}
