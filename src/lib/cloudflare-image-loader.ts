// Cloudflare Image Resizing loader
// Uses Cloudflare's built-in image optimization instead of Next.js default
// Docs: https://developers.cloudflare.com/images/transform-images/

interface ImageLoaderParams {
  src: string
  width: number
  quality?: number
}

export default function cloudflareImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderParams): string {
  // For local development, just return the src as-is
  if (process.env.NODE_ENV === "development") {
    return src
  }

  // For external URLs, use Cloudflare Image Resizing
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const params = new URLSearchParams({
      width: width.toString(),
      quality: quality.toString(),
      format: "auto",
    })
    return `/cdn-cgi/image/${params.toString()}/${src}`
  }

  // For local/relative images, use Cloudflare Image Resizing with the full URL
  const params = new URLSearchParams({
    width: width.toString(),
    quality: quality.toString(),
    format: "auto",
  })
  
  // Return the Cloudflare-optimized URL
  return `/cdn-cgi/image/${params.toString()}${src.startsWith("/") ? src : `/${src}`}`
}
