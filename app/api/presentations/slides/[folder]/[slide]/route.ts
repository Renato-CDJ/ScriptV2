import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest, { params }: { params: { folder: string; slide: string } }) {
  try {
    const { folder, slide } = params

    // Decode the folder name to handle special characters
    const decodedFolder = decodeURIComponent(folder)

    // Construct the path to the slide image
    const slidePath = join(process.cwd(), "public", "presentations", "slides", decodedFolder, slide)

    console.log("[v0] Attempting to read slide from:", slidePath)

    // Read the file
    const fileBuffer = await readFile(slidePath)

    // Return the image
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[v0] Error reading slide:", error)
    return new NextResponse("Slide not found", { status: 404 })
  }
}
