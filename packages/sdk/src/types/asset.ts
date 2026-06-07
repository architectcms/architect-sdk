export interface Asset {
  id: string
  title: string
  filename: string
  mimeType: string
  size: number
  url: string
  tags?: string[]
  alt?: string
  description?: string
  category?: string
}

export interface ImageTransformOptions {
  width?: number
  height?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  quality?: number
}
