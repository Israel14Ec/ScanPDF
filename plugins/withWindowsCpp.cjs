const { withAppBuildGradle, withProjectBuildGradle } = require('expo/config-plugins');

const marker = '// Mi Escaner PDF: Windows C++ driver';
const gradle = `
${marker}
// Windows can rename clang++.exe to CLANG_~1.EXE in paths with spaces.
// Force C++ mode so Clang also links the Android C++ standard library.
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
  subprojects { nativeProject ->
    ['com.android.application', 'com.android.library'].each { pluginId ->
      nativeProject.plugins.withId(pluginId) {
        nativeProject.extensions.getByName('androidComponents').finalizeDsl { androidDsl ->
          androidDsl.defaultConfig.externalNativeBuild.cmake.arguments.add(
            '-DCMAKE_CXX_FLAGS=--driver-mode=g++'
          )
        }
      }
    }
  }
}
`;

module.exports = function withWindowsCpp(config) {
  config = withProjectBuildGradle(config, (result) => {
    if (result.modResults.language !== 'groovy') {
      throw new Error('La corrección de C++ en Windows requiere build.gradle Groovy.');
    }
    if (!result.modResults.contents.includes(marker)) {
      result.modResults.contents += gradle;
    }
    return result;
  });

  // React Native's root plugin evaluates :app before the root subprojects
  // callback is registered. Configure :app directly during its evaluation.
  return withAppBuildGradle(config, (result) => {
    if (result.modResults.language !== 'groovy') {
      throw new Error('La corrección de C++ en Windows requiere app/build.gradle Groovy.');
    }
    if (!result.modResults.contents.includes(marker)) {
      result.modResults.contents += `
${marker}
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
  android {
    defaultConfig {
      externalNativeBuild {
        cmake {
          arguments '-DCMAKE_CXX_FLAGS=--driver-mode=g++'
        }
      }
    }
  }
}
`;
    }
    return result;
  });
};
