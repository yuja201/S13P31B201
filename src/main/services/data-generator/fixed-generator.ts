export interface FixedGeneratorConfig {
  fixedValue: string
  recordCnt: number
}

/**
 * 고정값을 지정된 횟수만큼 생성
 * @param config - 고정값 설정
 */
export async function* generateFixedStream(
  config: FixedGeneratorConfig
): AsyncGenerator<string, void, unknown> {
  const { fixedValue, recordCnt } = config

  for (let i = 0; i < recordCnt; i++) {
    yield fixedValue
  }
}
