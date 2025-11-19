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
  async (
    _event,
    projectId: number
  ): Promise<{
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
      thisWeek: getThisWeekTestCount(projectId),
      growthRate: getWeeklyGrowthRate(projectId),
      weeklyQueryStats: getWeeklyQueryStats(projectId),
      weeklyIndexStats: getWeeklyIndexStats(projectId),
      querySummary: getQuerySummary(projectId),
      indexSummary: getIndexSummary(projectId),
      queryChangeRate: getQueryWeeklyChangeRate(projectId),
      indexChangeRate: getIndexWeeklyChangeRate(projectId),
      weeklyTotalStats: getWeeklyTotalTestStats(projectId)
    }
  }
)
