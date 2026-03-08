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
import AccountConnectDialog from './AccountConnectDialog'
import { Avatar } from '@/components/ui/avatar'
import { CONNECT_ACCOUNT_DIALOG_EVENT } from '@/lib/ui/connectAccountDialog'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import useProfileQuery from '@/features/profile/useProfileQuery'

type NavItem = {
  label: string
  to: string
  icon: typeof Home
}

type NavGroup = {
  label: string
  items: NavItem[]
}

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
  const profileQuery = useProfileQuery(account)
  const locale = getLocale()

  const profileImage = profileQuery.data?.profileImage ?? null
  const accountLabel = useMemo(() => {
    if (!account) return m.app_shell_connect_account()
    return `@${account}`
  }, [account, locale])

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        label: m.app_shell_nav_group_content_creation(),
        items: [
          { label: m.app_shell_nav_write(), to: '/editor', icon: NotebookPen },
          { label: m.app_shell_nav_my_blog(), to: '/blog', icon: BookOpen },
          { label: m.app_shell_nav_drafts(), to: '/drafts', icon: NotebookText },
          { label: m.app_shell_nav_analytics(), to: '/analytics', icon: BarChart3 },
          { label: m.app_shell_nav_dashboard(), to: '/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: m.app_shell_nav_group_discover(),
        items: [
          { label: m.app_shell_nav_search(), to: '/search', icon: Search },
          { label: m.app_shell_nav_communities(), to: '/communities', icon: Users },
          { label: m.app_shell_nav_users(), to: '/users', icon: Users },
          { label: m.app_shell_nav_engagement(), to: '/engagement', icon: MessageSquare },
        ],
      },
      {
        label: m.app_shell_nav_group_app(),
        items: [
          { label: m.app_shell_nav_settings(), to: '/settings', icon: Settings },
          { label: m.app_shell_nav_prototype(), to: '/prototype', icon: FilePenLine },
        ],
      },
    ],
    [locale]
  )

  const breadcrumb = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const map: Record<string, string> = {
      dashboard: m.breadcrumb_dashboard(),
      drafts: m.breadcrumb_drafts(),
      editor: m.breadcrumb_editor(),
      blog: m.breadcrumb_my_blog(),
      search: m.breadcrumb_search(),
      communities: m.breadcrumb_communities(),
      users: m.breadcrumb_users(),
      engagement: m.breadcrumb_engagement(),
      analytics: m.breadcrumb_analytics(),
      settings: m.breadcrumb_settings(),
      prototype: m.breadcrumb_prototype(),
    }
    if (segments.length === 0) return [m.breadcrumb_dashboard()]
    return segments.map((segment) => map[segment] ?? segment)
  }, [pathname, locale])

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

  const handleConnect = async (username: string) => {
    if (!keychainAvailable) {
      return
    }
    setIsConnecting(true)
    const message = `Hivepen Studio login ${new Date().toISOString()}`
    const response = await signLogin(username.trim(), message)
    if (response.success) {
      setAccount(username.trim())
      setShowConnectDialog(false)
    } else {
      window.alert(response.message ?? m.app_shell_login_rejected())
    }
    setIsConnecting(false)
  }

  const handleLogout = () => {
    setAccount(null)
    router.navigate({ to: '/' })
  }

  const handleSwitchAccount = () => {
    setAccount(null)
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
                </Box>
              )}
            </HStack>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={m.app_shell_toggle_sidebar()}
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
                      {account ? m.app_shell_account_menu() : m.app_shell_connect_hive_account()}
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
                    {isConnecting ? m.app_shell_menu_connecting() : m.app_shell_menu_connect_account()}
                  </Menu.Item>
                )}
                <Menu.Item
                  value="switch"
                  onSelect={handleSwitchAccount}
                  disabled={!account}
                >
                  {m.app_shell_menu_switch_account()}
                </Menu.Item>
                <Menu.Item
                  value="settings"
                  onSelect={() => router.navigate({ to: '/settings' })}
                  disabled={!account}
                >
                  {m.app_shell_menu_account_settings()}
                </Menu.Item>
                <Menu.Item value="logout" onSelect={handleLogout} disabled={!account}>
                  {m.app_shell_menu_logout()}
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
          <HStack justify="space-between" gap={4} align="center">
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
