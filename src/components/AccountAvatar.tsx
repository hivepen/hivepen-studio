import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { Avatar, AvatarProps } from "./ui/avatar";
import { hiveAvatarUrl } from "@/lib/posts/tagColorConfig";

interface AccountAvatarProps extends AvatarProps {
    username:string | null
}

function AccountAvatar ({username, ...props}:AccountAvatarProps){

  const src:AvatarProps['src'] = username ? hiveAvatarUrl(username) : undefined


  return <Avatar src={src}  name={username ?? undefined} {...props}/>
}


function AuthAccountAvatar({...props}:AvatarProps){

    
  const [accountName, setAccountName] = useLocalStorageState<string | null>(
    'hivepen.account',
    null
  )

  return <AccountAvatar username={accountName}/>
}

export default AccountAvatar