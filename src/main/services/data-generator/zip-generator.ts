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
  fs.mkdirSync(outputDir, { recursive: true })

  const zipPath = path.join(outputDir, `dummy_data_${Date.now()}.zip`)
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve(zipPath)
    })

    archive.on('error', (err) => reject(err))
    archive.pipe(output)

    for (const file of files) {
      // 파일 경로 기반으로 바로 추가
      archive.file(file.path, { name: `${file.filename}.sql` })
    }

    archive.finalize()
  })
}
