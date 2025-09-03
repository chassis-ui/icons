import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

async function getPackageVersion() {
  try {
    const packageJson = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url))
    )
    return packageJson.version
  } catch (error) {
    throw new Error(`Failed to read package.json: ${  error.message}`)
  }
}

async function runCommand(command) {
  try {
    await execAsync(command)
  } catch (error) {
    throw new Error(`Failed to execute command "${command}": ${error.message}`)
  }
}

async function distIcons() {
  try {
    const version = await getPackageVersion()
    const baseDir = `chassis-icons-${version}`
    const svgDir = path.join(baseDir, 'svgs')

    await runCommand(`rm -rf ${baseDir} ${baseDir}.zip`)
    await runCommand(`mkdir -p ${svgDir}`)
    await runCommand(`cp -r svgs/ ${svgDir}`)
    await runCommand(`cp fonts/chassis-icons.svg ${baseDir}`)
    await runCommand(`cp -r fonts/* ${baseDir}`)
    await runCommand(`zip -qr9 ${baseDir}.zip ${baseDir}`)
    await runCommand(`rm -rf ${baseDir}`)

    console.log(`Done: ${baseDir}.zip\n`)
  } catch (error) {
    console.error('Error running icons-zip:', error)
  }
}

distIcons()
