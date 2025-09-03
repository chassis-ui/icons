import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const packageJsonPath = 'package.json'

async function modifyPackageJson(remove) {
  const packageJson = await fs.readFile(packageJsonPath, 'utf8')
  const packageData = JSON.parse(packageJson)

  if (remove) {
    delete packageData.type
  } else {
    packageData.type = 'module'
  }

  const updatedPackageJson = JSON.stringify(packageData, null, 2) + '\n'
  await fs.writeFile(packageJsonPath, updatedPackageJson)
}

async function runFantasticon() {
  try {
    // await modifyPackageJson(true)
    const { stdout, stderr } = await execAsync('npx fantasticon --config .fantasticonrc.cjs')
    console.log('Fantasticon output:', stdout)
    if (stderr) {
      console.error('Fantasticon errors:', stderr)
    }
  } catch (error) {
    console.error('Error running fantasticon:', error)
  } finally {
    // await modifyPackageJson(false)
  }
}

runFantasticon()
