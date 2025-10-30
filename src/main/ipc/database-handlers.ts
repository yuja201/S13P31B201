import { ipcMain } from 'electron'
import * as dbmsOps from '../database/dbms'
import * as projectOps from '../database/projects'
import * as databaseOps from '../database/databases'
import * as ruleOps from '../database/rules'
import { testDatabaseConnection, ConnectionConfig } from '../utils/db-connection-test'

/**
 * SQLite Database
 */

// DBMS operations
ipcMain.handle('db:dbms:getAll', () => {
  return dbmsOps.getAllDBMS()
})

ipcMain.handle('db:dbms:getById', (_, id: number) => {
  return dbmsOps.getDBMSById(id)
})

ipcMain.handle('db:dbms:create', (_, data) => {
  return dbmsOps.createDBMS(data)
})

ipcMain.handle('db:dbms:update', (_, data) => {
  return dbmsOps.updateDBMS(data)
})

ipcMain.handle('db:dbms:delete', (_, id: number) => {
  return dbmsOps.deleteDBMS(id)
})

// Project operations
ipcMain.handle('db:project:getAll', () => {
  return projectOps.getAllProjects()
})

ipcMain.handle('db:project:getById', (_, id: number) => {
  return projectOps.getProjectById(id)
})

ipcMain.handle('db:project:create', (_, data) => {
  return projectOps.createProject(data)
})

ipcMain.handle('db:project:update', (_, data) => {
  return projectOps.updateProject(data)
})

ipcMain.handle('db:project:delete', (_, id: number) => {
  return projectOps.deleteProject(id)
})

// Database operations
ipcMain.handle('db:database:getAll', () => {
  return databaseOps.getAllDatabases()
})

ipcMain.handle('db:database:getById', (_, id: number) => {
  return databaseOps.getDatabaseById(id)
})

ipcMain.handle('db:database:getByProjectId', (_, projectId: number) => {
  return databaseOps.getDatabasesByProjectId(projectId)
})

ipcMain.handle('db:database:create', (_, data) => {
  return databaseOps.createDatabase(data)
})

ipcMain.handle('db:database:update', (_, data) => {
  return databaseOps.updateDatabase(data)
})

ipcMain.handle('db:database:delete', (_, id: number) => {
  return databaseOps.deleteDatabase(id)
})

ipcMain.handle('db:database:updateConnectedAt', (_, id: number) => {
  return databaseOps.updateDatabaseConnectedAt(id)
})

// Rule operations
ipcMain.handle('db:rule:getAll', () => {
  return ruleOps.getAllRules()
})

ipcMain.handle('db:rule:getById', (_, id: number) => {
  return ruleOps.getRuleById(id)
})

ipcMain.handle('db:rule:getByDomain', (_, domain: string) => {
  return ruleOps.getRulesByDomain(domain)
})

ipcMain.handle('db:rule:create', (_, data) => {
  return ruleOps.createRule(data)
})

ipcMain.handle('db:rule:update', (_, data) => {
  return ruleOps.updateRule(data)
})

ipcMain.handle('db:rule:delete', (_, id: number) => {
  return ruleOps.deleteRule(id)
})

/**
 * MySQL/PostgreSQL Database
 */

// Database connection test
ipcMain.handle('db:connection:test', async (_, config: ConnectionConfig) => {
  return await testDatabaseConnection(config)
})
