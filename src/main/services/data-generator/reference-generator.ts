import { fetchReferenceRandomSamples, fetchReferenceUniqueSamples } from '../../utils/db-query'
import type { ReferenceMetaData } from './types'
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
}: ReferenceGenerateRequest): AsyncGenerator<string, void, unknown> {
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
      console.warn(`[${refTable}.${refColumn}] 고유 참조값이 요청된 개수(${recordCnt}
      )보다 적습니다. (${samples.length}개만 생성)`)
    }

    for (const row of samples) {
      yield String(row[refColumn])
    }
  } else {
    // --- 고유값 보장이 필요 없는 경우 ---
    // (성능을 위해 한 번에 가져오거나, 한 개씩 가져오는 방식 선택 가능)
    const samples = await fetchReferenceRandomSamples(
      connectionConfig,
      refTable,
      refColumn,
      recordCnt
    )

    for (const row of samples) {
      yield String(row[refColumn])
    }
  }
}
