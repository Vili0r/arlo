#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const SDK_VERSION = "0.1.0";
const ASYNC_STORAGE_VERSION = "^2.1.0";

function printHelp() {
  console.log(`Arlo SDK CLI

Usage:
  arlo-sdk init --project-id=<id> [options]
  arlo-sdk install --project-id=<id> [options]

Options:
  --project-id=<id>         Required. Arlo project id to bind the app to.
  --entry-point-key=<key>   Entry point key to present. Defaults to onboarding_home.
  --flow-slug=<slug>        Optional flow slug fallback.
  --api-key=<key>           Optional Arlo API key to prefill the generated config.
  --base-url=<url>          Optional base URL. Defaults to EXPO_PUBLIC_ARLO_BASE_URL.
  --cwd=<path>              Target app directory. Defaults to current directory.
  --skip-install            Update files but do not run the package manager install step.
  --force                   Overwrite generated Arlo files if they already exist.
  --dry-run                 Print the planned actions without writing files.
  --help                    Show this message.
`);
}

function parseArgs(argv) {
  const args = {
    _: [],
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }

    const eqIndex = arg.indexOf("=");
    if (eqIndex === -1) {
      args[arg.slice(2)] = true;
      continue;
    }

    const key = arg.slice(2, eqIndex);
    const value = arg.slice(eqIndex + 1);
    args[key] = value;
  }

  return args;
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, "bun.lock")) || fs.existsSync(path.join(cwd, "bun.lockb"))) {
    return { command: "bun", args: ["install"] };
  }

  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    return { command: "pnpm", args: ["install"] };
  }

  if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
    return { command: "yarn", args: ["install"] };
  }

  return { command: "npm", args: ["install"] };
}

function ensureDependencyBlock(pkg, key) {
  if (!pkg[key] || typeof pkg[key] !== "object") {
    pkg[key] = {};
  }

  return pkg[key];
}

function upsertDependency(pkg, name, version) {
  const dependencies = ensureDependencyBlock(pkg, "dependencies");
  if (!dependencies[name]) {
    dependencies[name] = version;
    return true;
  }

  return false;
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFileIfAllowed(filePath, contents, options) {
  const exists = fs.existsSync(filePath);
  if (exists && !options.force) {
    return { wrote: false, skipped: true };
  }

  if (!options.dryRun) {
    fs.writeFileSync(filePath, contents);
  }

  return { wrote: true, skipped: false };
}

function createConfigFile({ projectId, entryPointKey, flowSlug, apiKey, baseUrl }) {
  return `export const arloConfig = {
  projectId: ${JSON.stringify(projectId)},
  entryPointKey: ${JSON.stringify(entryPointKey)},
  flowSlug: ${JSON.stringify(flowSlug)},
  apiKey: process.env.EXPO_PUBLIC_ARLO_API_KEY ?? ${JSON.stringify(apiKey)},
  baseUrl: process.env.EXPO_PUBLIC_ARLO_BASE_URL ?? ${JSON.stringify(baseUrl)},
} as const;
`;
}

function createOnboardingScreenFile() {
  return `import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View } from "react-native";

import { createArloClient, createArloPresenter } from "arlo-sdk";
import {
  ArloPresenterRenderer,
  createArloRegistry,
  createReactNativeFlowCache,
} from "arlo-react-native";

import { arloConfig } from "./arlo.config";

const arloClient = createArloClient({
  apiKey: arloConfig.apiKey,
  projectId: arloConfig.projectId,
  baseUrl: arloConfig.baseUrl,
  cache: createReactNativeFlowCache({
    storage: AsyncStorage,
  }),
});

export function ArloOnboardingScreen() {
  const [presenter] = useState(() =>
    createArloPresenter({
      client: arloClient,
      handlers: {
        onCompleted({ snapshot }) {
          console.log("Arlo flow completed", snapshot.values);
        },
        onOpenUrl({ url }) {
          console.log("Open external URL", url);
        },
      },
    })
  );

  const [registry] = useState(() => createArloRegistry());

  useEffect(() => {
    async function present() {
      if (!arloConfig.apiKey) {
        return;
      }

      if (arloConfig.entryPointKey) {
        await presenter.presentEntryPoint(arloConfig.entryPointKey);
        return;
      }

      if (arloConfig.flowSlug) {
        await presenter.presentFlow(arloConfig.flowSlug);
      }
    }

    void present();
  }, [presenter]);

  if (!arloConfig.apiKey) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ textAlign: "center" }}>
          Set EXPO_PUBLIC_ARLO_API_KEY to load your Arlo onboarding flow.
        </Text>
      </View>
    );
  }

  return (
    <ArloPresenterRenderer
      presenter={presenter}
      registry={registry}
      loadingState={
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Loading onboarding...</Text>
        </View>
      }
      errorState={(message) => (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ textAlign: "center" }}>{message}</Text>
        </View>
      )}
    />
  );
}

export default ArloOnboardingScreen;
`;
}

function runInit(rawArgs) {
  const projectId = rawArgs["project-id"];
  if (!projectId || typeof projectId !== "string") {
    fail("Missing required --project-id");
  }

  const cwd = path.resolve(String(rawArgs.cwd || process.cwd()));
  const packageJsonPath = path.join(cwd, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    fail(`No package.json found in ${cwd}`);
  }

  const pkg = readJson(packageJsonPath);
  const dependencyChanges = [];

  if (upsertDependency(pkg, "arlo-sdk", `^${SDK_VERSION}`)) {
    dependencyChanges.push("arlo-sdk");
  }
  if (upsertDependency(pkg, "arlo-react-native", `^${SDK_VERSION}`)) {
    dependencyChanges.push("arlo-react-native");
  }
  if (upsertDependency(pkg, "@react-native-async-storage/async-storage", ASYNC_STORAGE_VERSION)) {
    dependencyChanges.push("@react-native-async-storage/async-storage");
  }

  const arloDir = path.join(cwd, "arlo");
  const configPath = path.join(arloDir, "arlo.config.ts");
  const screenPath = path.join(arloDir, "ArloOnboardingScreen.tsx");
  const entryPointKey =
    typeof rawArgs["entry-point-key"] === "string"
      ? rawArgs["entry-point-key"]
      : "onboarding_home";
  const flowSlug = typeof rawArgs["flow-slug"] === "string" ? rawArgs["flow-slug"] : "";
  const apiKey = typeof rawArgs["api-key"] === "string" ? rawArgs["api-key"] : "";
  const baseUrl =
    typeof rawArgs["base-url"] === "string"
      ? rawArgs["base-url"]
      : "http://YOUR_LOCAL_IP:3000";

  if (rawArgs["dry-run"]) {
    console.log(`Would update ${packageJsonPath}`);
    console.log(`Would ensure dependencies: ${dependencyChanges.length > 0 ? dependencyChanges.join(", ") : "already present"}`);
    console.log(`Would generate ${configPath}`);
    console.log(`Would generate ${screenPath}`);
  } else {
    writeJson(packageJsonPath, pkg);
    ensureDir(arloDir, false);
  }

  const configResult = writeFileIfAllowed(
    configPath,
    createConfigFile({
      projectId,
      entryPointKey,
      flowSlug,
      apiKey,
      baseUrl,
    }),
    { dryRun: Boolean(rawArgs["dry-run"]), force: Boolean(rawArgs.force) }
  );

  const screenResult = writeFileIfAllowed(
    screenPath,
    createOnboardingScreenFile(),
    { dryRun: Boolean(rawArgs["dry-run"]), force: Boolean(rawArgs.force) }
  );

  console.log(`Updated ${packageJsonPath}`);
  console.log(
    dependencyChanges.length > 0
      ? `Added dependencies: ${dependencyChanges.join(", ")}`
      : "Arlo dependencies were already present"
  );

  if (configResult.skipped) {
    console.log(`Skipped ${configPath} because it already exists. Re-run with --force to overwrite.`);
  } else {
    console.log(`Generated ${configPath}`);
  }

  if (screenResult.skipped) {
    console.log(`Skipped ${screenPath} because it already exists. Re-run with --force to overwrite.`);
  } else {
    console.log(`Generated ${screenPath}`);
  }

  if (!rawArgs["dry-run"] && !rawArgs["skip-install"]) {
    const packageManager = detectPackageManager(cwd);
    console.log(`Running ${packageManager.command} ${packageManager.args.join(" ")} in ${cwd}`);

    const result = spawnSync(packageManager.command, packageManager.args, {
      cwd,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      fail(`Package install failed with ${packageManager.command}`);
    }
  }

  console.log("");
  console.log("Next steps:");
  console.log(`1. Add <ArloOnboardingScreen /> from ${path.relative(cwd, screenPath) || "arlo/ArloOnboardingScreen.tsx"} to your app.`);
  console.log("2. Set EXPO_PUBLIC_ARLO_API_KEY and EXPO_PUBLIC_ARLO_BASE_URL in your Expo env.");
  console.log(`3. Launch the app and load entry point "${entryPointKey}"${flowSlug ? ` or flow "${flowSlug}"` : ""}.`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || args.help) {
    printHelp();
    process.exit(0);
  }

  if (command === "init" || command === "install") {
    runInit(args);
    return;
  }

  fail(`Unknown command "${command}"`);
}

main();
