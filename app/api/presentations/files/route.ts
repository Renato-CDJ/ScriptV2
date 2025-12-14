import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const presentationsPath = path.join(process.cwd(), "public", "presentations")

    // Check if directory exists
    if (!fs.existsSync(presentationsPath)) {
      return NextResponse.json({ files: [] })
    }

    // Read all files from presentations directory
    const files = fs.readdirSync(presentationsPath)

    // Filter only PPT/PPTX files and exclude README/gitkeep
    const pptFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return (ext === ".ppt" || ext === ".pptx") && !file.startsWith(".") && !file.toLowerCase().includes("readme")
      })
      .map((file) => ({
        name: file,
        path: `/presentations/${file}`,
        extension: path.extname(file).toLowerCase(),
        displayName: path.basename(file, path.extname(file)),
      }))

    return NextResponse.json({ files: pptFiles })
  } catch (error) {
    console.error("Error reading presentations directory:", error)
    return NextResponse.json({ files: [] })
  }
}
