import { fetchReferenceRandomSamples, fetchReferenceUniqueSamples } from '../../utils/db-query'
import type { ReferenceMetaData } from '@shared/types'
import type { ConnectionConfig } from '../../utils/db-connection-test'

export interface ReferenceGenerateRequest {
  recordCnt: number
  metaData: ReferenceMetaData
  connectionConfig: ConnectionConfig // DB 접속 정보
}

export async function* generateReferenceStream({
  recordCnt,
  metaData,
  connectionConfig
}: ReferenceGenerateRequest): AsyncGenerator<string | null, void, unknown> {
  const { refTable, refColumn, ensureUnique } = metaData

  if (ensureUnique) {
    // --- 고유값 보장이 필요한 경우 ---
    const samples = await fetchReferenceUniqueSamples(
      connectionConfig,
      refTable,
      refColumn,
      recordCnt
    )

    if (samples.length < recordCnt) {
      console.warn(
        `[${refTable}.${refColumn}] 고유 참조값이 요청된 개수(${recordCnt})보다 적습니다. (${samples.length}개만 생성)`
      )
    }

    for (const row of samples) {
      yield String(row[refColumn])
    }
  } else {
    // --- 고유값 보장이 필요 없는 경우 ---
    const samples = await fetchReferenceRandomSamples(
      connectionConfig,
      refTable,
      refColumn,
      recordCnt
    )

    // 참조 테이블이 비어있으면 값을 생성할 수 없음
    if (samples.length === 0) {
      for (let i = 0; i < recordCnt; i++) {
        yield null
      }
      return
    }

    // 가져온 샘플을 재활용하여 요청된 개수만큼 생성
    for (let i = 0; i < recordCnt; i++) {
      const randomRow = samples[i % samples.length]
      yield String(randomRow[refColumn])
    }
  }
}
