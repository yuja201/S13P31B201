import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

/**
 * 사용 중이지 않은 파일만 안전하게 삭제
 */
async function deleteIfNotBusy(filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) return

  try {
    const fd = await fs.promises.open(filePath, 'r')
    await fd.close()
    fs.unlinkSync(filePath)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'EBUSY' || code === 'EACCES') {
      // 사용 중인 파일은 건너뜀
      return
    }
    throw err
  }
}

/**
 * 대용량 SQL 파일들을 스트리밍으로 ZIP 압축하여 디스크에 저장
 * @param files SQL 파일 경로 목록
 * @param projectId 프로젝트 ID
 * @returns 생성된 ZIP 파일 경로
 */
export async function createZipFromSqlFilesStreaming(
  files: { filename: string; path: string }[],
  projectId: number
): Promise<string> {
  const outputDir = path.resolve(process.cwd(), 'generated', String(projectId))

  // 기존 ZIP 파일 중 사용 중이지 않은 것만 삭제
  if (fs.existsSync(outputDir)) {
    const existingFiles = fs.readdirSync(outputDir)
    for (const f of existingFiles) {
      if (f.endsWith('.zip')) {
        const fullPath = path.join(outputDir, f)
        await deleteIfNotBusy(fullPath)
      }
    }
  }

  await fs.promises.mkdir(outputDir, { recursive: true })

  const zipPath = path.join(outputDir, `dummy_data_${Date.now()}.zip`)
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.pipe(output)

  for (const file of files) {
    archive.file(file.path, { name: `${file.filename}.sql` })
  }

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath))
    archive.on('error', reject)
    archive.finalize().catch(reject)
  })
}
