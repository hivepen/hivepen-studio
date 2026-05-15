declare module 'qrcode' {
  type ToDataUrlOptions = {
    margin?: number
    width?: number
  }

  const QRCode: {
    toDataURL(input: string, options?: ToDataUrlOptions): Promise<string>
  }

  export default QRCode
}
