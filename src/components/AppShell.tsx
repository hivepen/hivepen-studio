import { Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Menu,
  Show,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  BarChart3,
  BookOpen,
  ChevronRightIcon,
  FilePenLine,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  NotebookPen,
  NotebookText,
  Search,
  Settings,
  Shuffle,
  SidebarCloseIcon,
  SidebarOpenIcon,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AccountConnectDialog from './AccountConnectDialog'
import AccountAvatar from './AccountAvatar'
import type { Home } from 'lucide-react'

import type { WalletProvider } from '@/lib/hive/walletAuth'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
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
  items: Array<NavItem>
}

export default function AppShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [collapsed, setCollapsed] = useState(true)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [connectingProvider, setConnectingProvider] =
    useState<WalletProvider | null>(null)
  const {
    account,
    connectWithHiveAuth,
    connectWithKeychain,
    disconnect,
    isHiveAuthAvailable,
    isHiveAuthLoading,
    isKeychainAvailable,
    pendingHiveAuthRequest,
  } = useHiveWallet()
  const profileQuery = useProfileQuery(account)
  const locale = getLocale()

  const accountLabel = useMemo(() => {
    if (!account) return m.app_shell_connect_account()
    return profileQuery.data?.displayName || `@${account}`
  }, [account, locale, profileQuery.data?.displayName])

  const navGroups: Array<NavGroup> = useMemo(
    () => [
      {
        label: m.app_shell_nav_group_content_creation(),
        items: [
          { label: m.app_shell_nav_write(), to: '/editor', icon: NotebookPen },
          { label: m.app_shell_nav_my_blog(), to: '/blog', icon: BookOpen },
          {
            label: m.app_shell_nav_drafts(),
            to: '/drafts',
            icon: NotebookText,
          },
          {
            label: m.app_shell_nav_analytics(),
            to: '/analytics',
            icon: BarChart3,
          },
          {
            label: m.app_shell_nav_dashboard(),
            to: '/dashboard',
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: m.app_shell_nav_group_discover(),
        items: [
          { label: m.app_shell_nav_search(), to: '/search', icon: Search },
          {
            label: m.app_shell_nav_communities(),
            to: '/communities',
            icon: Users,
          },
          { label: m.app_shell_nav_users(), to: '/users', icon: Users },
          {
            label: m.app_shell_nav_engagement(),
            to: '/engagement',
            icon: MessageSquare,
          },
        ],
      },
      {
        label: m.app_shell_nav_group_app(),
        items: [
          {
            label: m.app_shell_nav_settings(),
            to: '/settings',
            icon: Settings,
          },
          {
            label: m.app_shell_nav_prototype(),
            to: '/prototype',
            icon: FilePenLine,
          },
        ],
      },
    ],
    [locale],
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
      wallet: m.profile_wallet_button(),
    }
    if (segments.length === 0) return [m.breadcrumb_dashboard()]
    return segments.map((segment) => map[segment] ?? segment)
  }, [pathname, locale])

  useEffect(() => {
    const handleOpenConnectDialog = () => setShowConnectDialog(true)
    window.addEventListener(
      CONNECT_ACCOUNT_DIALOG_EVENT,
      handleOpenConnectDialog,
    )
    return () => {
      window.removeEventListener(
        CONNECT_ACCOUNT_DIALOG_EVENT,
        handleOpenConnectDialog,
      )
    }
  }, [])

  const handleConnect = async (provider: WalletProvider, username: string) => {
    if (!username.trim()) return

    setConnectingProvider(provider)

    const response =
      provider === 'hiveauth'
        ? await connectWithHiveAuth(username.trim())
        : await connectWithKeychain(username.trim())

    if (response.success) {
      setShowConnectDialog(false)
    } else {
      window.alert(response.error ?? m.app_shell_login_rejected())
    }

    setConnectingProvider(null)
  }

  const handleLogout = async () => {
    await disconnect()
    router.navigate({ to: '/' })
  }

  const handleSwitchAccount = () => {
    void disconnect()
    router.navigate({ to: '/' })
    setShowConnectDialog(true)
  }

  return (
    <Flex minH="100vh" bg="bg">
      <Box
        as="aside"
        w={{
          base: collapsed ? '0' : '280px',
          md: collapsed ? '84px' : '280px',
        }}
        bg="bg.panel"
        borderRight="1px solid"
        borderColor="border"
        transition="width 0.2s ease"
        position={{ base: 'fixed', md: 'sticky' }}
        left={0}
        top={0}
        zIndex={20}
        h="100vh"
        overflowX="hidden"
      >
        <Flex direction="column" h="100%" px={4} py={5} gap={6}>
          <HStack justify="space-between" align="center">
            <HStack gap={3} overflow="hidden">
              <Box w={10} h={10} overflow="hidden">
                <Image
                  src="https://images.hive.blog/u/hivepen/avatar"
                  alt="Hivepen Studio Isotype"
                />
              </Box>
              {!collapsed && (
                <Box>
                  <Text fontWeight="700" letterSpacing="-0.01em">
                    Hivepen Studio
                  </Text>
                </Box>
              )}
            </HStack>
            <Show when={!collapsed}>
              <IconButton
                display={{ md: 'none' }}
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={m.app_shell_toggle_sidebar()}
              >
                <Icon as={collapsed ? SidebarOpenIcon : SidebarCloseIcon} />
              </IconButton>
            </Show>
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
                <AccountAvatar size="sm" username={account} />
                {!collapsed && (
                  <Box textAlign="left">
                    <Text fontWeight="600" fontSize="sm">
                      {accountLabel}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {account
                        ? m.app_shell_account_menu()
                        : m.app_shell_connect_hive_account()}
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
                    disabled={Boolean(connectingProvider)}
                  >
                    <HStack gap={2}>
                      <Icon as={UserPlus} boxSize={4} />
                      <Text>
                        {connectingProvider
                          ? m.app_shell_menu_connecting()
                          : m.app_shell_menu_connect_account()}
                      </Text>
                    </HStack>
                  </Menu.Item>
                )}
                <Menu.Item
                  value="switch"
                  onSelect={handleSwitchAccount}
                  disabled={!account}
                >
                  <HStack gap={2}>
                    <Icon as={Shuffle} boxSize={4} />
                    <Text>{m.app_shell_menu_switch_account()}</Text>
                  </HStack>
                </Menu.Item>
                <Menu.Item
                  value="wallet"
                  onSelect={() =>
                    account
                      ? router.navigate({
                          to: '/$accountname/wallet',
                          params: { accountname: `@${account}` },
                        })
                      : undefined
                  }
                  disabled={!account}
                >
                  <HStack gap={2}>
                    <Icon as={Wallet} boxSize={4} />
                    <Text>{m.app_shell_menu_wallet()}</Text>
                  </HStack>
                </Menu.Item>
                <Menu.Item
                  value="settings"
                  onSelect={() => router.navigate({ to: '/settings' })}
                  disabled={!account}
                >
                  <HStack gap={2}>
                    <Icon as={Settings} boxSize={4} />
                    <Text>{m.app_shell_menu_account_settings()}</Text>
                  </HStack>
                </Menu.Item>
                <Menu.Item
                  value="logout"
                  onSelect={handleLogout}
                  disabled={!account}
                >
                  <HStack gap={2}>
                    <Icon as={LogOut} boxSize={4} />
                    <Text>{m.app_shell_menu_logout()}</Text>
                  </HStack>
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
          paddingInlineStart={{ base: 2, md: 4 }}
          paddingInlineEnd={{ base: 4, md: 6 }}
          paddingBlock={4}
        >
          <HStack justify="space-between" gap={4} align="center">
            <HStack gap={2} fontSize="sm" color="fg.muted">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={m.app_shell_toggle_sidebar()}
              >
                <Icon as={collapsed ? SidebarOpenIcon : SidebarCloseIcon} />
              </IconButton>

              <Text>Hivepen</Text>
              {breadcrumb.map((item, index) => (
                <HStack key={`${item}-${index}`} gap={2}>
                  <Icon color="fg.subtle">
                    <ChevronRightIcon size="14" />
                  </Icon>
                  <Text
                    color={index === breadcrumb.length - 1 ? 'fg' : 'fg.muted'}
                  >
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
        isConnecting={Boolean(connectingProvider)}
        isHiveAuthAvailable={isHiveAuthAvailable}
        isHiveAuthLoading={isHiveAuthLoading}
        keychainAvailable={isKeychainAvailable}
        pendingHiveAuthRequest={pendingHiveAuthRequest}
        connectingProvider={connectingProvider}
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
      <Link
        to={to}
        activeProps={{
          style: {
            background: 'var(--chakra-colors-bg-muted)',
            color: 'var(--chakra-colors-fg)',
          },
        }}
      >
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
