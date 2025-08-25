import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function distIcons() {
  try {
    await execAsync('rm -rf dist/')
    await execAsync('mkdir -p dist/svgs')
    await execAsync('cp -r icons/svgs/ dist/svgs')
    await execAsync('cp -r icons/package/* dist/')
    console.log('Icons copied successfully!')
  } catch (error) {
    console.error('Error running icons-dist:', error)
  }
}

distIcons()
