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
  Portal,
  Show,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Bell,
  BookOpen,
  ChevronRightIcon,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreVertical,
  NotebookPen,
  NotebookText,
  Plus,
  Search,
  Settings,
  SidebarCloseIcon,
  SidebarOpenIcon,
  SquarePen,
  User,
  UserIcon,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AccountConnectDialog from './AccountConnectDialog'
import AccountAvatar from './AccountAvatar'
import type { Home } from 'lucide-react'
import type {
  ConnectedWalletAccount,
  WalletProvider,
} from '@/lib/hive/walletAuth'

import { formatWalletProviderName } from '@/lib/hive/walletAuth'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import { toaster } from '@/components/ui/toaster'
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

type MobileNavItemId =
  | 'profile'
  | 'wallet'
  | 'editor'
  | 'explore'
  | 'notifications'

type MobileNavNavigateTarget = {
  to: string
  params?: Record<string, string>
}

type MobileNavItem = {
  icon: typeof Home
  id: MobileNavItemId
  isActive: boolean
  isDisabled: boolean
  label: string
  target: MobileNavNavigateTarget | null
}

const DEFAULT_MOBILE_NAV_ORDER: Array<MobileNavItemId> = [
  'profile',
  'wallet',
  'editor',
  'explore',
  'notifications',
]

export default function AppShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [collapsed, setCollapsed] = useState(true)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [connectingProvider, setConnectingProvider] =
    useState<WalletProvider | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [walletActionKey, setWalletActionKey] = useState<string | null>(null)
  const {
    account,
    connectedAccounts,
    connectWithHiveAuth,
    connectWithKeychain,
    disconnectAccount,
    isHiveAuthAvailable,
    isHiveAuthLoading,
    isKeychainAvailable,
    pendingHiveAuthRequest,
    switchAccount,
  } = useHiveWallet()
  const safeConnectedAccounts = Array.isArray(connectedAccounts)
    ? connectedAccounts
    : []
  const profileQuery = useProfileQuery(account)
  const locale = getLocale()

  const accountLabel = useMemo(() => {
    if (!account) return m.app_shell_connect_account()
    return profileQuery.data?.displayName || `@${account}`
  }, [account, locale, profileQuery.data?.displayName])

  const hasConnectedAccounts = safeConnectedAccounts.length > 0

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
          { label: m.app_shell_nav_users(), to: '/users', icon: UserIcon },
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
        ],
      },
    ],
    [locale],
  )

  const mobileNavItems = useMemo<Array<MobileNavItem>>(() => {
    const accountRouteParams = account ? { accountname: `@${account}` } : null

    const config: Record<
      MobileNavItemId,
      Omit<MobileNavItem, 'isActive' | 'isDisabled' | 'label' | 'target'> & {
        getLabel: () => string
        getTarget: () => MobileNavNavigateTarget | null
        match: (currentPathname: string) => boolean
      }
    > = {
      profile: {
        icon: User,
        id: 'profile',
        getLabel: () => m.mobile_nav_profile(),
        getTarget: () =>
          accountRouteParams
            ? { to: '/$accountname', params: accountRouteParams }
            : null,
        match: (currentPathname) =>
          Boolean(account) &&
          (currentPathname === `/@${account}` ||
            currentPathname === `/profile/@${account}`),
      },
      wallet: {
        icon: Wallet,
        id: 'wallet',
        getLabel: () => m.mobile_nav_wallet(),
        getTarget: () =>
          accountRouteParams
            ? { to: '/$accountname/wallet', params: accountRouteParams }
            : null,
        match: (currentPathname) =>
          Boolean(account) && currentPathname === `/@${account}/wallet`,
      },
      editor: {
        icon: SquarePen,
        id: 'editor',
        getLabel: () => m.mobile_nav_editor(),
        getTarget: () => ({ to: '/editor' }),
        match: (currentPathname) => currentPathname.startsWith('/editor'),
      },
      explore: {
        icon: Compass,
        id: 'explore',
        getLabel: () => m.mobile_nav_explore(),
        getTarget: () => ({ to: '/search' }),
        match: (currentPathname) =>
          currentPathname.startsWith('/search') ||
          currentPathname.startsWith('/communities') ||
          currentPathname.startsWith('/users'),
      },
      notifications: {
        icon: Bell,
        id: 'notifications',
        getLabel: () => m.mobile_nav_notifications(),
        getTarget: () => ({ to: '/engagement' }),
        match: (currentPathname) => currentPathname.startsWith('/engagement'),
      },
    }

    return DEFAULT_MOBILE_NAV_ORDER.map((id) => {
      const item = config[id]
      const target = item.getTarget()

      return {
        icon: item.icon,
        id: item.id,
        isActive: item.match(pathname),
        isDisabled: target === null,
        label: item.getLabel(),
        target,
      }
    })
  }, [account, locale, pathname])

  const breadcrumb = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const map: Record<string, string> = {
      analytics: 'Analytics',
      dashboard: m.breadcrumb_dashboard(),
      drafts: m.breadcrumb_drafts(),
      editor: m.breadcrumb_editor(),
      blog: m.breadcrumb_my_blog(),
      search: m.breadcrumb_search(),
      communities: m.breadcrumb_communities(),
      users: m.breadcrumb_users(),
      engagement: m.breadcrumb_engagement(),
      settings: m.breadcrumb_settings(),
      wallet: m.profile_wallet_button(),
    }
    if (segments.length === 0) return [m.breadcrumb_dashboard()]
    return segments.map((segment) => map[segment] ?? segment)
  }, [pathname, locale])

  const openConnectDialog = () => {
    setAccountMenuOpen(false)
    setConnectError(null)
    setShowConnectDialog(true)
  }

  const closeSidebarOnMobile = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 47.99em)').matches
    ) {
      setCollapsed(true)
    }
  }

  const closeConnectDialog = () => {
    setConnectError(null)
    setShowConnectDialog(false)
  }

  useEffect(() => {
    const handleOpenConnectDialog = () => openConnectDialog()
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

    setConnectError(null)
    setConnectingProvider(provider)

    const response =
      provider === 'hiveauth'
        ? await connectWithHiveAuth(username.trim())
        : await connectWithKeychain(username.trim())

    if (response.success) {
      toaster.success({
        description: m.app_shell_toast_account_connected({
          account: username.trim(),
        }),
        closable: true,
      })
      setConnectError(null)
      setShowConnectDialog(false)
    } else {
      setConnectError(response.error ?? m.app_shell_login_rejected())
    }

    setConnectingProvider(null)
  }

  const handleSwitchAccount = async (username: string) => {
    setWalletActionKey(`switch:${username}`)
    const response = await switchAccount(username)
    if (!response.success) {
      toaster.error({
        description:
          response.error ?? m.app_shell_toast_account_switch_failed(),
        closable: true,
      })
    } else {
      toaster.success({
        description: m.app_shell_toast_account_switched({
          account: username,
        }),
        closable: true,
      })
      setAccountMenuOpen(false)
      closeSidebarOnMobile()
    }
    setWalletActionKey(null)
  }

  const handleDisconnectAccount = async (username: string) => {
    const shouldNavigateHome =
      username === account && safeConnectedAccounts.length === 1
    const isActiveAccount = username === account
    setWalletActionKey(`disconnect:${username}`)
    const response = await disconnectAccount(username)
    if (!response.success) {
      toaster.error({
        description:
          response.error ?? m.app_shell_toast_account_disconnect_failed(),
        closable: true,
      })
    } else if (shouldNavigateHome) {
      toaster.success({
        description: m.app_shell_toast_account_disconnected({
          account: username,
        }),
        closable: true,
      })
      setAccountMenuOpen(false)
      closeSidebarOnMobile()
      router.navigate({ to: '/' })
    } else {
      toaster.success({
        description: isActiveAccount
          ? m.app_shell_toast_account_disconnected({
              account: username,
            })
          : m.app_shell_toast_account_removed({
              account: username,
            }),
        closable: true,
      })
      setAccountMenuOpen(false)
      closeSidebarOnMobile()
    }
    setWalletActionKey(null)
  }

  return (
    <Flex minH="100vh" bg="bg">
      <Box
        display={{ base: collapsed ? 'none' : 'block', md: 'none' }}
        position="fixed"
        inset={0}
        bg="blackAlpha.500"
        zIndex={19}
        onClick={() => setCollapsed(true)}
      />
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
        overflow="hidden"
        boxShadow={{ base: collapsed ? 'none' : 'xl', md: 'none' }}
      >
        <Flex direction="column" h="100%" px={4} py={5} gap={4}>
          <HStack justify="space-between" align="center" flexShrink={0}>
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

          <Box flex="1" minH={0} overflowY="auto" overflowX="hidden" pe={1}>
            <VStack align="stretch" gap={4}>
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
                        onNavigate={closeSidebarOnMobile}
                      />
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </Box>

          <Menu.Root
            open={accountMenuOpen}
            onOpenChange={(details) => setAccountMenuOpen(details.open)}
            positioning={{
              placement: collapsed ? 'right-end' : 'top-start',
              strategy: 'fixed',
              gutter: 8,
            }}
          >
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
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  minW="320px"
                  bg="bg.panel"
                  borderColor="border"
                  p={2}
                >
                  <VStack align="stretch" gap={1}>
                    {safeConnectedAccounts.map((connectedAccount) => (
                      <AccountMenuRow
                        key={connectedAccount.account}
                        connectedAccount={connectedAccount}
                        busy={
                          Boolean(connectingProvider) ||
                          walletActionKey !== null
                        }
                        onOpenWallet={() => {
                          setAccountMenuOpen(false)
                          closeSidebarOnMobile()
                          return router.navigate({
                            to: '/$accountname/wallet',
                            params: {
                              accountname: `@${connectedAccount.account}`,
                            },
                          })
                        }}
                        onSwitch={() =>
                          void handleSwitchAccount(connectedAccount.account)
                        }
                        onDisconnect={() =>
                          void handleDisconnectAccount(
                            connectedAccount.account,
                          )
                        }
                      />
                    ))}

                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      w="full"
                      minH="16"
                      px={2}
                      py={2}
                      borderRadius="xl"
                      onClick={() => {
                        closeSidebarOnMobile()
                        openConnectDialog()
                      }}
                      disabled={
                        Boolean(connectingProvider) || walletActionKey !== null
                      }
                    >
                      <HStack gap={3} w="full" minW={0}>
                        <Box
                          w="2px"
                          h="8"
                          borderRadius="full"
                          bg="transparent"
                          flexShrink={0}
                        />
                        <Box
                          boxSize={9}
                          borderRadius="full"
                          borderWidth="1px"
                          borderStyle="dashed"
                          borderColor="border"
                          bg="bg.subtle"
                          color="fg.muted"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Icon as={Plus} boxSize={4} />
                        </Box>
                        <Box minW={0} textAlign="left">
                          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                            {connectingProvider
                              ? m.app_shell_menu_connecting()
                              : hasConnectedAccounts
                                ? m.app_shell_menu_connect_another_account()
                                : m.app_shell_menu_connect_account()}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            {m.app_shell_connect_hive_account()}
                          </Text>
                        </Box>
                      </HStack>
                    </Button>
                  </VStack>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
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

              {breadcrumb.map((item, index) => (
                <HStack key={`${item}-${index}`} gap={2}>
                  {index > 0 ? (
                    <Icon color="fg.subtle">
                      <ChevronRightIcon size="14" />
                    </Icon>
                  ) : null}
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
        <Box
          flex="1"
          bg="bg.subtle"
          overflowY="auto"
          pb={{ base: '88px', md: 0 }}
        >
          {children ?? <Outlet />}
        </Box>
        <MobileBottomNav
          items={mobileNavItems}
          onConnect={openConnectDialog}
          onNavigate={(target) => {
            closeSidebarOnMobile()
            return router.navigate(target)
          }}
        />
      </Flex>
      <AccountConnectDialog
        open={showConnectDialog}
        onClose={closeConnectDialog}
        onConnect={handleConnect}
        isConnecting={Boolean(connectingProvider)}
        isHiveAuthAvailable={isHiveAuthAvailable}
        isHiveAuthLoading={isHiveAuthLoading}
        keychainAvailable={isKeychainAvailable}
        pendingHiveAuthRequest={pendingHiveAuthRequest}
        connectingProvider={connectingProvider}
        errorMessage={connectError}
        onClearError={() => setConnectError(null)}
      />
    </Flex>
  )
}

function NavButton({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: typeof Home
  label: string
  collapsed: boolean
  onNavigate?: () => void
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
        onClick={onNavigate}
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

function AccountMenuRow({
  connectedAccount,
  busy,
  onOpenWallet,
  onSwitch,
  onDisconnect,
}: {
  connectedAccount: ConnectedWalletAccount
  busy: boolean
  onOpenWallet: () => void
  onSwitch: () => void
  onDisconnect: () => void
}) {
  const isDisabled = busy || connectedAccount.isActive

  return (
    <HStack gap={2} align="stretch">
      <Button
        variant="ghost"
        justifyContent="flex-start"
        flex="1"
        minW={0}
        minH="16"
        px={2}
        py={2}
        borderRadius="xl"
        disabled={isDisabled}
        onClick={onSwitch}
      >
        <HStack gap={3} w="full" minW={0}>
          <Box
            w="2px"
            h="8"
            borderRadius="full"
            bg={connectedAccount.isActive ? 'fg' : 'transparent'}
            flexShrink={0}
          />
          <AccountAvatar username={connectedAccount.account} boxSize={9} />
          <Box minW={0} textAlign="left">
            <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
              @{connectedAccount.account}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {formatWalletProviderName(connectedAccount.provider)}
            </Text>
          </Box>
        </HStack>
      </Button>

      <Menu.Root positioning={{ placement: 'right-start', gutter: 4 }}>
        <Menu.Trigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            alignSelf="center"
            aria-label={m.app_shell_menu_account_actions()}
            disabled={busy}
          >
            <Icon as={MoreVertical} boxSize={4} />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="220px" bg="bg.panel" borderColor="border">
              <Menu.Item
                value={`wallet-${connectedAccount.account}`}
                onSelect={onOpenWallet}
              >
                <HStack gap={2}>
                  <Icon as={Wallet} boxSize={4} />
                  <Text>{m.app_shell_menu_wallet()}</Text>
                </HStack>
              </Menu.Item>
              <Menu.Item
                value={`disconnect-${connectedAccount.account}`}
                onSelect={onDisconnect}
              >
                <HStack gap={2}>
                  <Icon as={LogOut} boxSize={4} />
                  <Text>{m.app_shell_menu_disconnect()}</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </HStack>
  )
}

function MobileBottomNav({
  items,
  onConnect,
  onNavigate,
}: {
  items: Array<MobileNavItem>
  onConnect: () => void
  onNavigate: (target: MobileNavNavigateTarget) => void
}) {
  return (
    <Box
      as="nav"
      display={{ base: 'block', md: 'none' }}
      borderTop="1px solid"
      borderColor="border"
      bg="bg.panel"
      px={2}
      pt={2}
      pb="calc(env(safe-area-inset-bottom, 0px) + 0.5rem)"
    >
      <HStack gap={1} justify="space-between" align="stretch">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            flex="1"
            minW={0}
            minH="16"
            px={2}
            py={2}
            borderRadius="xl"
            color={item.isActive ? 'fg' : 'fg.muted'}
            bg={item.isActive ? 'bg.subtle' : 'transparent'}
            opacity={item.isDisabled ? 0.72 : 1}
            onClick={() => {
              if (!item.target) {
                onConnect()
                return
              }
              onNavigate(item.target)
            }}
          >
            <VStack gap={1} w="full">
              <Icon as={item.icon} boxSize={4.5} />
              <Text fontSize="2xs" fontWeight={item.isActive ? '600' : '500'}>
                {item.label}
              </Text>
            </VStack>
          </Button>
        ))}
      </HStack>
    </Box>
  )
}
