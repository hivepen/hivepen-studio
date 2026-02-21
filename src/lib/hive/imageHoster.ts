const IMAGE_HOST = 'https://images.hive.blog'

type UploadResult = {
  url: string
}

export async function uploadImageToHive({
  file,
  accessToken,
}: {
  file: File
  accessToken?: string | null
}) {
  if (!accessToken) {
    throw new Error('HiveSigner access token required for image uploads.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${IMAGE_HOST}/hs/${accessToken}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Image upload failed.')
  }

  const result = (await response.json()) as UploadResult
  return result.url
}
