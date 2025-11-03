import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

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
  await fs.promises.mkdir(outputDir, { recursive: true })

  const zipPath = path.join(outputDir, `dummy_data_${Date.now()}.zip`)
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.pipe(output)

  for (const file of files) {
    const stat = fs.existsSync(file.path) ? fs.statSync(file.path) : null
    console.log(`📦 ${file.filename} => exists: ${!!stat}, size: ${stat?.size ?? 0}`)
    archive.file(file.path, { name: `${file.filename}.sql` })
  }

  return new Promise((resolve, reject) => {
    // finish: 모든 데이터가 OS에 완전히 write된 시점
    output.on('finish', () => {
      console.log(`[ZIP] Stream fully flushed: ${zipPath}`)
      resolve(zipPath)
    })

    archive.on('warning', (err) => console.warn('⚠️ Archiver warning:', err))
    archive.on('error', (err) => {
      console.error('❌ Archiver error:', err)
      reject(err)
    })

    archive.finalize().catch(reject)
  })
}
