import { ipcMain } from 'electron'
import {
  getThisWeekTestCount,
  getWeeklyGrowthRate,
  getWeeklyQueryStats,
  getWeeklyIndexStats,
  getQuerySummary,
  getIndexSummary,
  getQueryWeeklyChangeRate,
  getIndexWeeklyChangeRate,
  getWeeklyTotalTestStats
} from '../database/tests'

ipcMain.handle(
  'tests:get-dashboard-data',
  async (): Promise<{
    thisWeek: number
    growthRate: number
    weeklyQueryStats: ReturnType<typeof getWeeklyQueryStats>
    weeklyIndexStats: ReturnType<typeof getWeeklyIndexStats>
    querySummary: ReturnType<typeof getQuerySummary>
    indexSummary: ReturnType<typeof getIndexSummary>
    queryChangeRate: number
    indexChangeRate: number
    weeklyTotalStats: ReturnType<typeof getWeeklyTotalTestStats>
  }> => {
    return {
      thisWeek: getThisWeekTestCount(),
      growthRate: getWeeklyGrowthRate(),
      weeklyQueryStats: getWeeklyQueryStats(),
      weeklyIndexStats: getWeeklyIndexStats(),
      querySummary: getQuerySummary(),
      indexSummary: getIndexSummary(),
      queryChangeRate: getQueryWeeklyChangeRate(),
      indexChangeRate: getIndexWeeklyChangeRate(),
      weeklyTotalStats: getWeeklyTotalTestStats()
    }
  }
)
