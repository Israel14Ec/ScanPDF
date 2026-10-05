const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');

const env = { ...process.env };

if (process.platform === 'win32') {
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT ||
    join(env.LOCALAPPDATA, 'Android', 'Sdk');
  if (!existsSync(sdk)) throw new Error(`No se encuentra el SDK de Android: ${sdk}`);

  // Keep clang++.exe's name intact: CMake can shorten it to CLANG_~1.EXE
  // when its parent path contains spaces, losing the C++ linker defaults.
  const shortSdk = execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `(New-Object -ComObject Scripting.FileSystemObject).GetFolder('${sdk.replace(/'/g, "''")}').ShortPath`,
  ], { env, encoding: 'utf8' }).trim();
  if (!shortSdk || /\s/.test(shortSdk)) {
    throw new Error('El SDK necesita una ruta sin espacios para compilar C++.');
  }
  env.ANDROID_HOME = shortSdk;
  env.ANDROID_SDK_ROOT = shortSdk;

  const studioJava = join(env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr');
  if (existsSync(join(studioJava, 'bin', 'java.exe'))) {
    env.JAVA_HOME = studioJava;
    env.PATH = `${join(studioJava, 'bin')};${env.PATH || env.Path || ''}`;
    delete env.Path;
  }
  console.log(`Android SDK: ${env.ANDROID_HOME}`);
  console.log(`Java: ${env.JAVA_HOME || 'PATH'}`);
}

if (!process.argv.includes('--check')) {
  const cli = require.resolve('expo/bin/cli');
  const child = spawn(process.execPath, [cli, 'run:android', ...process.argv.slice(2)], {
    env, stdio: 'inherit',
  });
  child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
}
